export declare class AuthResponseDto {
    success: boolean;
    data?: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        store?: {
            id: string;
            name: string;
            phone: string;
            plan: string;
        };
        staff?: {
            id: string;
            name: string;
            role: string;
        };
        is_new_user?: boolean;
    };
    message?: string;
}
