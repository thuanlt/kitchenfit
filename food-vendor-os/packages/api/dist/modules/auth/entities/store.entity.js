"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
const typeorm_1 = require("typeorm");
const staff_entity_1 = require("./staff.entity");
let Store = class Store {
};
exports.Store = Store;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Store.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 20 }),
    __metadata("design:type", String)
], Store.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Store.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "owner_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "avatar_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'free' }),
    __metadata("design:type", String)
], Store.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Store.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Store.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Store.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => staff_entity_1.Staff, (staff) => staff.store),
    __metadata("design:type", Array)
], Store.prototype, "staff", void 0);
exports.Store = Store = __decorate([
    (0, typeorm_1.Entity)('stores')
], Store);
//# sourceMappingURL=store.entity.js.map