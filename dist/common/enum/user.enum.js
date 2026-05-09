"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailEnum = exports.providerEnum = exports.RoleEnum = exports.GenderEnum = void 0;
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
    RoleEnum["superAdmin"] = "superAdmin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var providerEnum;
(function (providerEnum) {
    providerEnum["system"] = "system";
    providerEnum["google"] = "google";
    providerEnum["facebook"] = "facebook";
})(providerEnum || (exports.providerEnum = providerEnum = {}));
var EmailEnum;
(function (EmailEnum) {
    EmailEnum["confirmedEmail"] = "confirmedEmail";
    EmailEnum["forgetPassword"] = "forgetPassword";
})(EmailEnum || (exports.EmailEnum = EmailEnum = {}));
