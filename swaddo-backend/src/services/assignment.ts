import { Server } from 'socket.io';
import { routeETA } from './maps/mapProvider';
import { notificationService } from './notification';

interface OnlineRider {
  socketId: string;
  isBusy: boolean;
  lat?: number;
  lng?: number;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
function calculatePickupPayout(distance: number): number {
  if (distance <= 0.4) return 0;
  if (distance <= 1.0) return Math.round((1 + ((distance - 0.4) / 0.6) * 2) * 10) / 10;
  if (distance <= 2.0) return Math.round((3 + ((distance - 1.0) / 1.0) * 2) * 10) / 10;
  return Math.round((5 + ((distance - 2.0) / 1.0) * 1.5) * 10) / 10;
}

export class AssignmentManager {
  private io: Server | null = null;
  public onlineRiders: Map<string, OnlineRider> = new Map();
  private activeJobs: Map<string, Set<string>> = new Map();
  private jobPayloads: Map<string, any> = new Map();
  private jobTimers: Map<string, NodeJS.Timeout> = new Map();
  private jobOffers: Map<string, any> = new Map();

  async init(io: Server) {
    this.io = io;
    try {
      const { pool } = require('../db');
      console.log("[Assignment] Running Auto-Recovery for stuck orders...");
      const res = await pool.query(`
        SELECT o.id, o.stall_id, o.customer_id, o.delivery_address, o.delivery_instructions, o.restaurant_instructions,
               o.delivery_lat, o.delivery_lng, o.total_amount,
               u.name as customer_name,
               s.name as stall_name, s.latitude as pickup_lat, s.longitude as pickup_lng
        FROM orders o
        LEFT JOIN users u ON o.customer_id = u.id
        LEFT JOIN stalls s ON o.stall_id = s.id
        LEFT JOIN delivery_assignments da ON da.order_id = o.id AND da.status IN ('accepted', 'picked_up')
        WHERE o.status = 'ready' AND da.id IS NULL
      `);
      
      if (res.rows.length > 0) {
        console.log(`[Assignment] Found ${res.rows.length} unassigned ready orders. Restarting broadcast...`);
        
        const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371; 
          const dLat = (lat2 - lat1) * (Math.PI / 180);
          const dLon = (lon2 - lon1) * (Math.PI / 180);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return parseFloat((R * c).toFixed(1));
        };

        for (const order of res.rows) {
          const itemsRes = await pool.query(`
            SELECT mi.name, oi.quantity, mi.price
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = $1
          `, [order.id]);
          
          let itemCount = 0;
          const itemsDesc = itemsRes.rows.map((i: any) => {
            itemCount += i.quantity;
            return `${i.quantity}x ${i.name}`;
          }).join(', ');
          
          const dropoffDistance = getDistanceFromLatLonInKm(
            order.pickup_lat, order.pickup_lng,
            order.delivery_lat, order.delivery_lng
          );
          
          let earnings = 15;
          if (dropoffDistance > 1.5) {
            earnings += Math.ceil((dropoffDistance - 1.5) / 0.5) * 5;
          }
          let returnPayout = 0;
          if (dropoffDistance > 2.5) {
            returnPayout = Math.ceil((dropoffDistance - 2.5) / 0.5) * 5;
          }
          
          const payload = {
            id: 'job_' + order.id,
            dropoffDistance,
            earnings,
            customerName: order.customer_name,
            itemCount,
            itemsSummary: itemsDesc,
            stallName: order.stall_name,
            pickupLat: order.pickup_lat,
            pickupLng: order.pickup_lng,
            deliveryLat: order.delivery_lat,
            deliveryLng: order.delivery_lng,
            returnPayout
          };
          
          this.startJobRing(payload);
        }
      } else {
        console.log("[Assignment] No stuck ready orders found.");
      }
    } catch (e) {
      console.error("[Assignment] Auto-Recovery failed", e);
    }
  }

  getOnlineRider(riderId: string): OnlineRider | undefined {
    return this.onlineRiders.get(riderId);
  }

  getAvailableRiders(): [string, OnlineRider][] {
    return Array.from(this.onlineRiders.entries()).filter(([_, data]) => !data.isBusy);
  }

  registerRider(riderId: string, socketId: string, lat?: number, lng?: number) {
    this.onlineRiders.set(riderId, { socketId, isBusy: false, lat, lng });
    console.log(`[Assignment] Rider ${riderId} registered with socket ${socketId} at ${lat}, ${lng}`);
    this.checkPendingJobsForRider(riderId);
  }

  updateRiderLocation(riderId: string, lat: number, lng: number) {
    const rider = this.onlineRiders.get(riderId);
    if (rider) {
      rider.lat = lat;
      rider.lng = lng;
      
      // Update the database so `last_ping` stays fresh and broadcastJob doesn't filter them out
      const { pool } = require('../db');
      pool.query(
        `UPDATE delivery_partners SET last_lat = $1, last_lng = $2, last_ping = NOW() WHERE user_id = $3`,
        [lat, lng, riderId]
      ).catch((e: any) => console.error(`[Assignment] Failed to update location ping for rider ${riderId}`, e));

      this.checkPendingJobsForRider(riderId);
    }
  }

  private checkPendingJobsForRider(riderId: string) {
    const rider = this.onlineRiders.get(riderId);
    if (!rider || rider.isBusy || !rider.lat || !rider.lng) return;

    for (const [jobId, payload] of this.jobPayloads.entries()) {
      const notified = this.activeJobs.get(jobId);
      if (notified && !notified.has(riderId)) {
         console.log(`[Assignment] Newly available rider ${riderId} detected for active job ${jobId}. Retrying broadcast...`);
         this.broadcastJob(payload);
         return; // Only try assigning one job at a time to this rider
      }
    }
    
    // Check DB as well when a rider goes online
    this.recoverStuckOrders();
  }

  private async recoverStuckOrders() {
    try {
      const { pool } = require('../db');
      const res = await pool.query(`
        SELECT o.*, s.name as stall_name, s.location as stall_location, s.latitude as stall_lat, s.longitude as stall_lng 
        FROM orders o 
        LEFT JOIN stalls s ON o.stall_id = s.id 
        WHERE o.status IN ('ready', 'waiting')
      `);
      
      for (const order of res.rows) {
        const jobId = 'job_' + order.id;
        if (!this.jobPayloads.has(jobId)) {
          console.log(`[Assignment] Found STUCK ready order ${order.id}. Auto-recovering...`);
          
          const stallLat = order.stall_lat || 25.611;
          const stallLng = order.stall_lng || 85.144;
          const deliveryLat = order.delivery_lat || stallLat;
          const deliveryLng = order.delivery_lng || stallLng;
          
          const dropoffDistance = getDistance(stallLat, stallLng, deliveryLat, deliveryLng);
          
          let fee = 15;
          if (dropoffDistance <= 1.4) {
            fee = 15;
          } else if (dropoffDistance <= 2.0) {
            fee = 15 + ((dropoffDistance - 1.4) / 0.6) * 4;
          } else if (dropoffDistance <= 3.0) {
            fee = 19 + ((dropoffDistance - 2.0) / 1.0) * 5;
          } else if (dropoffDistance <= 4.0) {
            fee = 24 + ((dropoffDistance - 3.0) / 1.0) * 6;
          } else {
            fee = 30 + ((dropoffDistance - 4.0) / 1.0) * 6;
          }
          const earnings = Math.round(fee * 100) / 100;
          
          let returnPayout = 0;
          if (dropoffDistance > 3.0 && dropoffDistance <= 3.5) {
             returnPayout = ((dropoffDistance - 3.0) / 0.5) * 3;
          } else if (dropoffDistance > 3.5) {
             returnPayout = 3 + ((dropoffDistance - 3.5) / 1.0) * 10; 
          }
          returnPayout = Math.round(returnPayout * 10) / 10;
          
          const payload = {
            id: jobId,
            orderId: order.id,
            stallName: order.stall_name || ("Stall #" + order.stall_id),
            stallAddress: order.stall_location || "Food Court",
            stallLat: stallLat,
            stallLng: stallLng,
            pickupLat: order.pickup_lat || stallLat,
            pickupLng: order.pickup_lng || stallLng,
            pickupDistance: null, 
            customerName: order.customer_name,
            customerAddress: order.delivery_address || "Customer Location",
            itemCount: 1,
            itemsSummary: "Items", 
            deliveryInstructions: order.delivery_instructions,
            restaurantInstructions: order.restaurant_instructions,
            dropoffDistance: parseFloat(dropoffDistance.toFixed(1)),
            earnings: earnings,
            returnPayout: returnPayout
          };
          this.startJobRing(payload, 120000);
        }
      }
    } catch (err) {
      console.error("[Assignment] Error checking stuck DB jobs:", err);
    }
  }

  handleRiderLogout(riderId: string) {
    this.onlineRiders.delete(riderId);
    for (const [jobId, notifiedRiders] of this.activeJobs.entries()) {
      if (notifiedRiders.has(riderId)) {
        console.log(`[Assignment] Rider ${riderId} logged out while ringing for job ${jobId}. Auto-rejecting...`);
        notifiedRiders.delete(riderId);
        
        if (this.io) {
          this.io.to(`rider_${riderId}`).emit('job_revoked', { id: jobId });
        }

        if (this.jobTimers.has(jobId)) {
          clearTimeout(this.jobTimers.get(jobId)!);
          this.jobTimers.delete(jobId);
        }
        
        const payload = this.jobPayloads.get(jobId);
        if (payload) {
          this.broadcastJob(payload);
        }
      }
    }
  }

  unregisterSocket(socketId: string) {
    for (const [riderId, data] of this.onlineRiders.entries()) {
      if (data.socketId === socketId) {
        this.onlineRiders.delete(riderId);
        console.log(`[Assignment] Rider ${riderId} disconnected`);
        break;
      }
    }
  }

  startJobRing(jobPayload: any, _ringDurationMs: number = 120000) {
    const jobId = jobPayload.id;
    this.activeJobs.set(jobId, new Set());
    this.jobPayloads.set(jobId, jobPayload);
    this.broadcastJob(jobPayload);
  }

  private async broadcastJob(jobPayload: any) {
    if (!this.activeJobs.has(jobPayload.id)) return;

    const notifiedRiders = this.activeJobs.get(jobPayload.id)!;

    const { pool } = require('../db');
    
    try {
      const orderId = jobPayload.orderId || jobPayload.id.toString().replace('job_', '');
      const orderCheck = await pool.query(`SELECT status FROM orders WHERE id = $1`, [orderId]);
      if (orderCheck.rows.length === 0 || orderCheck.rows[0].status !== 'ready') {
        console.log(`[Assignment] Job ${jobPayload.id} is no longer ready in DB. Revoking from memory.`);
        this.revokeJob(jobPayload.id);
        return;
      }
    } catch (e) {
      console.error(`[Assignment] Error verifying order status for ${jobPayload.id}:`, e);
    }
    
    // DB-Driven: Find all online riders with fresh GPS (< 5 minutes) who have < 2 active assignments
    let totalAvailable: [string, any][] = [];
    try {
      const dbRes = await pool.query(`
        SELECT dp.user_id, dp.last_lat, dp.last_lng,
               COUNT(da.id) as active_count,
               MAX(s.latitude) as active_pickup_lat,
               MAX(s.longitude) as active_pickup_lng,
               MAX(o.delivery_lat) as active_delivery_lat,
               MAX(o.delivery_lng) as active_delivery_lng
        FROM delivery_partners dp
        LEFT JOIN delivery_assignments da 
          ON da.delivery_partner_id = dp.id 
          AND da.status IN ('accepted', 'picked_up')
        LEFT JOIN orders o ON da.order_id = o.id
        LEFT JOIN stalls s ON o.stall_id = s.id
        WHERE dp.current_status = 'online' 
          AND (dp.cooldown IS NULL OR dp.cooldown = false)
          AND dp.last_ping >= NOW() - INTERVAL '5 minutes'
        GROUP BY dp.id, dp.user_id, dp.last_lat, dp.last_lng
        HAVING COUNT(da.id) < 2
      `);
      
      const stallLat = jobPayload.stallLat || jobPayload.stall?.lat || jobPayload.pickupLat || 25.611;
      const stallLng = jobPayload.stallLng || jobPayload.stall?.lng || jobPayload.pickupLng || 85.130;
      const deliveryLat = jobPayload.deliveryLat || 25.611;
      const deliveryLng = jobPayload.deliveryLng || 85.130;

      for (const row of dbRes.rows) {
        const rId = row.user_id.toString();
        const activeCount = parseInt(row.active_count);
        let isStacked = false;

        if (activeCount === 1) {
          // Check stacking constraints
          const pLat = parseFloat(row.active_pickup_lat);
          const pLng = parseFloat(row.active_pickup_lng);
          const dLat = parseFloat(row.active_delivery_lat);
          const dLng = parseFloat(row.active_delivery_lng);
          
          if (!isNaN(pLat) && !isNaN(pLng) && !isNaN(dLat) && !isNaN(dLng)) {
             const pickupDiff = getDistance(stallLat, stallLng, pLat, pLng);
             const dropDiff = getDistance(deliveryLat, deliveryLng, dLat, dLng);
             
             if (pickupDiff <= 0.7 && dropDiff <= 1.0) {
               isStacked = true;
             } else {
               // Rider has an active assignment and new order is NOT on route. Skip.
               continue;
             }
          } else {
            // Cannot verify route. Skip.
            continue;
          }
        }

        // Fallback: check in-memory busy state just in case (only if activeCount == 0, we trust DB more now, but let's keep it for safety if they aren't stacked)
        const memRider = this.onlineRiders.get(rId);
        if (activeCount === 0 && memRider && memRider.isBusy) continue;
        
        // Prevent simultaneous overlapping rings: If this rider is already ringing for another job, skip them!
        let isRingingForOtherJob = false;
        for (const [otherJobId, notifiedSet] of this.activeJobs.entries()) {
           if (otherJobId !== jobPayload.id && notifiedSet.has(rId)) {
               isRingingForOtherJob = true;
               break;
           }
        }
        if (isRingingForOtherJob) continue;
        
        let lat = parseFloat(row.last_lat);
        let lng = parseFloat(row.last_lng);
        
        if (isNaN(lat) && memRider && memRider.lat) lat = memRider.lat;
        if (isNaN(lng) && memRider && memRider.lng) lng = memRider.lng;
        
        // Final fallback to 0 if really missing to avoid NaNs, though they will be filtered by distance
        if (isNaN(lat)) lat = 0;
        if (isNaN(lng)) lng = 0;

        totalAvailable.push([rId, { lat, lng, isStacked }]);
      }
    } catch (err) {
      console.error("[Assignment] Error querying available riders from DB:", err);
    }

    const availableRiders = totalAvailable.filter(([rId, data]) => !notifiedRiders.has(rId));

    // If there is only 1 rider online, do NOT revoke. Just re-notify them.
    const isSingleRider = totalAvailable.length === 1;

    // Revoke from previously notified rider if they ignored it, UNLESS they are the only rider
    if (notifiedRiders.size > 0 && this.io && !isSingleRider) {
      for (const riderId of notifiedRiders) {
        if (this.io) {
          this.io.to(`rider_${riderId}`).emit('job_revoked', { id: jobPayload.id });
        }
      }
    }

    // Calculate distance for each available rider
    const stallLat = jobPayload.stallLat || jobPayload.stall?.lat || jobPayload.pickupLat || 25.611;
    const stallLng = jobPayload.stallLng || jobPayload.stall?.lng || jobPayload.pickupLng || 85.130;
    
    let ridersWithDistance = availableRiders.map(([riderId, data]) => {
      // Default to a large distance if no GPS available
      let distance = 999999;
      if (data.lat && data.lng) {
        distance = getDistance(stallLat, stallLng, data.lat, data.lng);
      }
      return { riderId, data, distance };
    });

    let allRiders = [...ridersWithDistance];

    // 1. Max Radius (4.0 km)
    ridersWithDistance = ridersWithDistance.filter(r => r.distance <= 4.0);

    // Fallback: If no rider is within 4.0km but someone is online, guarantee assignment to the nearest rider so no order is stuck
    if (ridersWithDistance.length === 0 && allRiders.length > 0) {
      allRiders.sort((a, b) => a.distance - b.distance);
      ridersWithDistance = [allRiders[0]];
    }

    // 2. Tiered Priority Search
    const hasRiderUnder1_0km = ridersWithDistance.some(r => r.distance <= 1.0);
    if (hasRiderUnder1_0km) {
      // Limit to 1.0 km if available
      ridersWithDistance = ridersWithDistance.filter(r => r.distance <= 1.0);
    } else {
      // If none under 1.0 km, limit to 2.0 km if available
      const hasRiderUnder2_0km = ridersWithDistance.some(r => r.distance <= 2.0);
      if (hasRiderUnder2_0km) {
        ridersWithDistance = ridersWithDistance.filter(r => r.distance <= 2.0);
      }
      // If none under 2.0 km, it will use the remaining riders up to 4.0 km
    }

    if (ridersWithDistance.length === 0) {
      if (totalAvailable.length === 0) {
        console.log(`[Assignment] No riders online for job ${jobPayload.id}. Retrying in 10s.`);
        this.jobTimers.set(jobPayload.id, setTimeout(() => this.broadcastJob(jobPayload), 10000));
        return;
      }
      console.log(`[Assignment] No eligible riders within range for job ${jobPayload.id}. Restarting loop.`);
      notifiedRiders.clear(); // reset and try again from the start
      this.jobTimers.set(jobPayload.id, setTimeout(() => this.broadcastJob(jobPayload), 2000));
      return;
    }

    // Broadcast to ALL eligible riders simultaneously (First-Come-First-Serve)
    for (const rider of ridersWithDistance) {
      // Use haversine distance + 20% as an approximation for road distance to avoid Google Maps API rate limits on mass broadcast
      let actualPickupDistance = rider.distance * 1.2; 
      
      notifiedRiders.add(rider.riderId);
      
      let pickupPayout = calculatePickupPayout(actualPickupDistance);
      let deliveryPay = jobPayload.earnings || 0;
      let returnPay = jobPayload.returnPayout || 0;
      let totalPayout = deliveryPay + pickupPayout + returnPay;

      // STACKED ORDER OVERRIDE: Flat 15 Rs
      if (rider.data.isStacked) {
         pickupPayout = 0;
         deliveryPay = 15;
         returnPay = 0;
         totalPayout = 15;
      }

      const jobWithDistance = { 
        ...jobPayload, 
        pickupDistance: parseFloat(actualPickupDistance.toFixed(1)),
        pickupPayout: pickupPayout,
        deliveryPay: deliveryPay,
        totalPayout: totalPayout,
        isStacked: rider.data.isStacked || false
      };
      
      this.jobOffers.set(`${jobPayload.id}_${rider.riderId}`, {
        pickupDistance: parseFloat(actualPickupDistance.toFixed(1)),
        dropoffDistance: jobPayload.dropoffDistance || 0,
        totalPayout: totalPayout,
        pickupPayout: pickupPayout,
        returnPayout: returnPay
      });
      
      if (this.io) {
        this.io.to(`rider_${rider.riderId}`).emit('job_offer', jobWithDistance);
        let numericRiderId = parseInt(rider.riderId.replace('rider_', ''), 10);
        notificationService.sendToRider(
          numericRiderId,
          'New Delivery Assignment! 🛵',
          `Distance: ${actualPickupDistance.toFixed(1)} km | Payout: ₹${totalPayout}`,
          { 
            orderId: jobPayload.id.toString(), 
            type: 'new_job',
            customerName: jobPayload.customerName,
            customerAddress: jobPayload.customerAddress,
            itemCount: jobPayload.itemCount?.toString() || "0",
            itemsSummary: jobPayload.itemsSummary,
            stallName: jobPayload.stallName || "Restaurant",
            pickupDistance: actualPickupDistance.toFixed(1),
            dropoffDistance: (jobPayload.dropoffDistance || 0).toString(),
            deliveryPay: deliveryPay.toString(),
            totalPayout: totalPayout.toString(),
            pickupPayout: pickupPayout.toString(),
            returnPayout: returnPay.toString()
          }
        );
      }
      
      console.log(`[Assignment] Job ${jobPayload.id} broadcasted to rider ${rider.riderId} (Distance: ${actualPickupDistance.toFixed(2)} km)`);
    }
    
    // If not accepted by ANYONE in 300 seconds, retry broadcast
    this.jobTimers.set(jobPayload.id, setTimeout(() => {
      console.log(`[Assignment] Job ${jobPayload.id} ignored by all riders, restarting broadcast...`);
      this.broadcastJob(jobPayload);
    }, 300000));
  }

  acceptJob(jobId: string, acceptedByRiderId: string): any | null {
    if (!this.activeJobs.has(jobId)) return null;

    // Retrieve the exact promised payout for THIS specific rider
    const offerKey = `${jobId}_${acceptedByRiderId}`;
    const promisedOffer = this.jobOffers.get(offerKey);
    if (!promisedOffer) {
      console.warn(`[Assignment] Job ${jobId} accepted by ${acceptedByRiderId}, but no recorded offer found!`);
      return null;
    }

    if (this.jobTimers.has(jobId)) {
      clearTimeout(this.jobTimers.get(jobId)!);
      this.jobTimers.delete(jobId);
    }

    const notifiedRiders = this.activeJobs.get(jobId)!;
    
    for (const riderId of notifiedRiders) {
      if (this.io) {
        this.io.to(`rider_${riderId}`).emit('job_revoked', { id: jobId });
        console.log(`[Assignment] Job ${jobId} revoked from Rider ${riderId}`);
      }
    }

    this.activeJobs.delete(jobId);
    this.jobPayloads.delete(jobId);
    // Cleanup any offers related to this jobId
    for (const key of this.jobOffers.keys()) {
      if (key.startsWith(`${jobId}_`)) {
        this.jobOffers.delete(key);
      }
    }
    
    const accepter = this.onlineRiders.get(acceptedByRiderId);
    if (accepter) {
       // We can no longer assume they are universally 'busy' and unavailable for stacked orders. 
       // The DB query handles this by checking COUNT(da.id) < 2.
       // However, we still set isBusy = true as a hint for other memory checks if needed.
       accepter.isBusy = true;
    }

    return promisedOffer;
  }

  markRiderAvailable(riderId: string) {
    const rider = this.onlineRiders.get(riderId);
    if (rider) {
      rider.isBusy = false;
      console.log(`[Assignment] Rider ${riderId} marked as available.`);
      this.checkPendingJobsForRider(riderId);
    }
  }

  revokeJob(jobId: string) {
    if (!this.activeJobs.has(jobId)) return;
    
    if (this.jobTimers.has(jobId)) {
      clearTimeout(this.jobTimers.get(jobId)!);
      this.jobTimers.delete(jobId);
    }

    const notifiedRiders = this.activeJobs.get(jobId)!;
    for (const riderId of notifiedRiders) {
      const riderData = this.onlineRiders.get(riderId);
      if (riderData && this.io) {
        this.io.to(riderData.socketId).emit('job_revoked', { id: jobId });
      }
    }
    
    this.activeJobs.delete(jobId);
    this.jobPayloads.delete(jobId);
  }
}

export const assignmentManager = new AssignmentManager();
