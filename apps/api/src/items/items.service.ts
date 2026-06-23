import { Injectable } from '@nestjs/common';
import type { Item } from '@vecta/shared-types';

@Injectable()
export class ItemsService {
  private items: Item[] = [{ id: '1', name: 'Sample item' }];

  findAll(): Item[] {
    return this.items;
  }

  create(name: string): Item {
    const item = { id: String(this.items.length + 1), name };
    this.items.push(item);
    return item;
  }
}
