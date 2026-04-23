import { Store } from './store.entity';
export declare class Staff {
    id: string;
    phone: string;
    name: string;
    role: string;
    pin_code: string;
    is_active: boolean;
    created_at: Date;
    store: Store;
    get store_id(): string;
}
