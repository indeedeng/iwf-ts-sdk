"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureAuthMethods = void 0;
/**
 * Creates the authentication methods from a swagger description.
 *
 */
function configureAuthMethods(config) {
    let authMethods = {};
    if (!config) {
        return authMethods;
    }
    authMethods["default"] = config["default"];
    return authMethods;
}
exports.configureAuthMethods = configureAuthMethods;
