import { Injectable } from '@nestjs/common';
import { tenantContext } from '../guards/tenant.guard';

export interface FindOptions {
  where?: Record<string, any>;
  select?: string[];
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
}

@Injectable()
export abstract class TenantScopedRepository<T> {
  constructor(
    protected readonly db: any, // Your database service
    protected readonly tableName: string,
  ) {}
  
  protected getTenantId(): string {
    const context = tenantContext.getStore();
    if (!context?.tenantId) {
      throw new Error('No tenant context available for repository operation');
    }
    return context.tenantId;
  }
  
  protected addTenantFilter(filters: any = {}): any {
    return {
      ...filters,
      tenantId: this.getTenantId(),
    };
  }
  
  async findAll(options: FindOptions = {}): Promise<T[]> {
    const { where = {}, select, orderBy, limit, offset } = options;
    
    let query = this.db
      .select(select || '*')
      .from(this.tableName)
      .where(this.addTenantFilter(where));
      
    if (orderBy) {
      Object.entries(orderBy).forEach(([column, direction]) => {
        query = query.orderBy(column, direction);
      });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    if (offset) {
      query = query.offset(offset);
    }
    
    return query;
  }
  
  async findOne(id: string): Promise<T | null> {
    const result = await this.db
      .select('*')
      .from(this.tableName)
      .where(this.addTenantFilter({ id }))
      .first();
      
    return result || null;
  }
  
  async findOneBy(conditions: Record<string, any>): Promise<T | null> {
    const result = await this.db
      .select('*')
      .from(this.tableName)
      .where(this.addTenantFilter(conditions))
      .first();
      
    return result || null;
  }
  
  async create(data: Partial<T>): Promise<T> {
    const [created] = await this.db
      .insert(this.addTenantFilter(data))
      .into(this.tableName)
      .returning('*');
      
    return created;
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    const [updated] = await this.db
      .update(data)
      .table(this.tableName)
      .where(this.addTenantFilter({ id }))
      .returning('*');
      
    if (!updated) {
      throw new Error(`${this.tableName} with id ${id} not found in tenant`);
    }
      
    return updated;
  }
  
  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete()
      .from(this.tableName)
      .where(this.addTenantFilter({ id }));
      
    return deleted > 0;
  }
  
  async count(conditions: Record<string, any> = {}): Promise<number> {
    const [{ count }] = await this.db
      .count('* as count')
      .from(this.tableName)
      .where(this.addTenantFilter(conditions));
      
    return parseInt(count as string, 10);
  }
  
  async exists(conditions: Record<string, any>): Promise<boolean> {
    const count = await this.count(conditions);
    return count > 0;
  }
  
  // Batch operations
  async createMany(data: Partial<T>[]): Promise<T[]> {
    const dataWithTenant = data.map(item => this.addTenantFilter(item));
    
    const created = await this.db
      .insert(dataWithTenant)
      .into(this.tableName)
      .returning('*');
      
    return created;
  }
  
  async updateMany(
    conditions: Record<string, any>,
    data: Partial<T>,
  ): Promise<number> {
    const updated = await this.db
      .update(data)
      .table(this.tableName)
      .where(this.addTenantFilter(conditions));
      
    return updated;
  }
  
  async deleteMany(conditions: Record<string, any>): Promise<number> {
    const deleted = await this.db
      .delete()
      .from(this.tableName)
      .where(this.addTenantFilter(conditions));
      
    return deleted;
  }
}