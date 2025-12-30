import { Injectable } from '@nestjs/common';
import { Response } from 'express';

export interface SseClient {
  id: string;
  userId?: string;
  response: Response;
}

@Injectable()
export class SseService {
  private clients: Map<string, SseClient> = new Map();

  /**
   * Add a new SSE client
   */
  addClient(clientId: string, response: Response, userId?: string): void {
    this.clients.set(clientId, { id: clientId, userId, response });

    // Send initial connection message
    this.sendEventToClient(clientId, 'connected', { clientId, timestamp: new Date().toISOString() });
  }

  /**
   * Remove a client when they disconnect
   */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  /**
   * Send event to a specific client
   */
  sendEventToClient(clientId: string, event: string, data: any): void {
    const client = this.clients.get(clientId);
    if (client && !client.response.writableEnded) {
      client.response.write(`event: ${event}\n`);
      client.response.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  /**
   * Send event to a specific user (all their connected clients)
   */
  sendEventToUser(userId: string, event: string, data: any): void {
    this.clients.forEach((client) => {
      if (client.userId === userId && !client.response.writableEnded) {
        client.response.write(`event: ${event}\n`);
        client.response.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    });
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: string, data: any): void {
    this.clients.forEach((client) => {
      if (!client.response.writableEnded) {
        client.response.write(`event: ${event}\n`);
        client.response.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    });
  }

  /**
   * Send order update to buyer and all sellers of stores in that order
   */
  notifyOrderUpdate(orderId: string, buyerUserId: string, sellerUserIds: string[], orderData: any): void {
    // Notify buyer
    this.sendEventToUser(buyerUserId, 'order:updated', { orderId, ...orderData });

    // Notify all sellers
    sellerUserIds.forEach((sellerId) => {
      this.sendEventToUser(sellerId, 'order:updated', { orderId, ...orderData });
    });
  }

  /**
   * Send discount activation/deactivation events
   */
  notifyDiscountStatusChange(discountId: string, status: 'activated' | 'deactivated', discountData: any): void {
    this.broadcast('discount:statusChanged', { discountId, status, ...discountData });
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }
}
