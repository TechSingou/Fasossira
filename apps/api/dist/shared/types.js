"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentStatus = exports.PaymentMethod = exports.ReservationStatus = exports.SaleChannel = exports.ScheduleStatus = exports.BusStatus = exports.SubscriptionStatus = exports.UserRole = void 0;
exports.segmentsOverlap = segmentsOverlap;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["AGENT"] = "AGENT";
})(UserRole || (exports.UserRole = UserRole = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
    SubscriptionStatus["SUSPENDED"] = "SUSPENDED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var BusStatus;
(function (BusStatus) {
    BusStatus["ACTIVE"] = "ACTIVE";
    BusStatus["MAINTENANCE"] = "MAINTENANCE";
    BusStatus["RETIRED"] = "RETIRED";
})(BusStatus || (exports.BusStatus = BusStatus = {}));
var ScheduleStatus;
(function (ScheduleStatus) {
    ScheduleStatus["SCHEDULED"] = "SCHEDULED";
    ScheduleStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ScheduleStatus["COMPLETED"] = "COMPLETED";
    ScheduleStatus["CANCELLED"] = "CANCELLED";
})(ScheduleStatus || (exports.ScheduleStatus = ScheduleStatus = {}));
var SaleChannel;
(function (SaleChannel) {
    SaleChannel["AGENCY"] = "AGENCY";
    SaleChannel["ON_ROUTE"] = "ON_ROUTE";
    SaleChannel["ONLINE"] = "ONLINE";
})(SaleChannel || (exports.SaleChannel = SaleChannel = {}));
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["CONFIRMED"] = "CONFIRMED";
    ReservationStatus["CANCELLED"] = "CANCELLED";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["MOBILE_MONEY_ORANGE"] = "MOBILE_MONEY_ORANGE";
    PaymentMethod["MOBILE_MONEY_MOOV"] = "MOBILE_MONEY_MOOV";
    PaymentMethod["CARD"] = "CARD";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
function segmentsOverlap(fromA, toA, fromB, toB) {
    return fromA < toB && toA > fromB;
}
//# sourceMappingURL=types.js.map