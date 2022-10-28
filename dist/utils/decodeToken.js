"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
exports.default = (token) => {
    return new Promise((resolve, reject) => {
        (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err)
                reject(new Error("Unauthorized"));
            resolve(String(decoded));
        });
    });
};
//# sourceMappingURL=decodeToken.js.map