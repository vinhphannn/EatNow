import { Types } from 'mongoose';

/**
 * Mục đích: Chuẩn hóa định danh actor dùng xuyên suốt hệ thống ví
 * ActorRef = ownerType + actorId (ObjectId dạng string)
 */
export type ActorType = 'customer' | 'restaurant' | 'driver' | 'admin';

export interface ActorRef {
  ownerType: ActorType;
  actorId: string; // ObjectId dạng string
  userId?: string; // phục vụ audit/log nếu cần
}

/**
 * Kiểm tra và chuẩn hóa ObjectId string
 */
export function toObjectIdString(id: any): string {
  if (!id) return '';
  return Types.ObjectId.isValid(id) ? String(id) : String(id);
}

/**
 * Resolve ActorRef từ request theo ownerType mong muốn.
 * - customer/admin: actorId = req.user.id
 * - restaurant: actorId = req.user.restaurantId (nếu có) hoặc sẽ để trống để controller tự map
 * - driver: actorId = req.user.driverId (nếu có)
 */
export function resolveActorRefFromReq(req: any, ownerType: ActorType): ActorRef {
  const userId = req?.user?.id ? String(req.user.id) : undefined;

  let actorId: string | undefined;
  if (ownerType === 'customer' || ownerType === 'admin') {
    actorId = userId;
  } else if (ownerType === 'restaurant') {
    actorId = req?.user?.restaurantId ? String(req.user.restaurantId) : undefined;
  } else if (ownerType === 'driver') {
    actorId = req?.user?.driverId ? String(req.user.driverId) : undefined;
  }

  return { ownerType, actorId: actorId || '', userId };
}


