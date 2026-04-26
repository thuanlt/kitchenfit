import { Staff } from './staff.entity';
export declare class Store {
    id: string;
    phone: string;
    name: string;
    address: string;
    owner_name: string;
    avatar_url: string;
    plan: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    staff: Staff[];
}
