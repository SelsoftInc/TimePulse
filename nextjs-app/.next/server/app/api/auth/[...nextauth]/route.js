"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=D%3A%5Cselsoft%5CWebApp%5CTimePulse%5Cnextjs-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Cselsoft%5CWebApp%5CTimePulse%5Cnextjs-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=D%3A%5Cselsoft%5CWebApp%5CTimePulse%5Cnextjs-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Cselsoft%5CWebApp%5CTimePulse%5Cnextjs-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var D_selsoft_WebApp_TimePulse_nextjs_app_src_app_api_auth_nextauth_route_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/[...nextauth]/route.js */ \"(rsc)/./src/app/api/auth/[...nextauth]/route.js\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"D:\\\\selsoft\\\\WebApp\\\\TimePulse\\\\nextjs-app\\\\src\\\\app\\\\api\\\\auth\\\\[...nextauth]\\\\route.js\",\n    nextConfigOutput,\n    userland: D_selsoft_WebApp_TimePulse_nextjs_app_src_app_api_auth_nextauth_route_js__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/[...nextauth]/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLmpzJmFwcERpcj1EJTNBJTVDc2Vsc29mdCU1Q1dlYkFwcCU1Q1RpbWVQdWxzZSU1Q25leHRqcy1hcHAlNUNzcmMlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUQlM0ElNUNzZWxzb2Z0JTVDV2ViQXBwJTVDVGltZVB1bHNlJTVDbmV4dGpzLWFwcCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDd0M7QUFDckg7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90aW1lcHVsc2UtbmV4dGpzLz9jOTYxIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkQ6XFxcXHNlbHNvZnRcXFxcV2ViQXBwXFxcXFRpbWVQdWxzZVxcXFxuZXh0anMtYXBwXFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXGF1dGhcXFxcWy4uLm5leHRhdXRoXVxcXFxyb3V0ZS5qc1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJEOlxcXFxzZWxzb2Z0XFxcXFdlYkFwcFxcXFxUaW1lUHVsc2VcXFxcbmV4dGpzLWFwcFxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUuanNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=D%3A%5Cselsoft%5CWebApp%5CTimePulse%5Cnextjs-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Cselsoft%5CWebApp%5CTimePulse%5Cnextjs-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/auth/[...nextauth]/route.js":
/*!*************************************************!*\
  !*** ./src/app/api/auth/[...nextauth]/route.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_auth_providers_google__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/google */ \"(rsc)/./node_modules/next-auth/providers/google.js\");\n\n\n// Validate environment variables\nif (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {\n    console.warn(\"⚠️ Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local\");\n}\nconst authOptions = {\n    providers: [\n        (0,next_auth_providers_google__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            clientId: process.env.GOOGLE_CLIENT_ID || \"\",\n            clientSecret: process.env.GOOGLE_CLIENT_SECRET || \"\",\n            authorization: {\n                params: {\n                    prompt: \"consent\",\n                    access_type: \"offline\",\n                    response_type: \"code\"\n                }\n            }\n        })\n    ],\n    pages: {\n        signIn: \"/login\",\n        error: \"/login\"\n    },\n    callbacks: {\n        async signIn ({ user, account, profile }) {\n            // Always allow sign in, we'll handle user check in redirect\n            return true;\n        },\n        async jwt ({ token, user, account, profile }) {\n            if (user) {\n                token.id = user.id;\n                token.email = user.email;\n                token.name = user.name;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (token) {\n                session.user.id = token.id;\n                session.user.email = token.email;\n                session.user.name = token.name;\n            }\n            return session;\n        },\n        async redirect ({ url, baseUrl }) {\n            // If redirecting to base URL or login, go to auth callback\n            if (url === baseUrl || url === `${baseUrl}/login`) {\n                return `${baseUrl}/auth/callback`;\n            }\n            // If URL starts with baseUrl, allow it\n            if (url.startsWith(baseUrl)) {\n                return url;\n            }\n            // Default to auth callback\n            return `${baseUrl}/auth/callback`;\n        }\n    },\n    session: {\n        strategy: \"jwt\",\n        maxAge: 30 * 24 * 60 * 60\n    },\n    secret: process.env.NEXTAUTH_SECRET,\n    debug: \"development\" === \"development\"\n};\nconst handler = next_auth__WEBPACK_IMPORTED_MODULE_0___default()(authOptions);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBaUM7QUFDdUI7QUFFeEQsaUNBQWlDO0FBQ2pDLElBQUksQ0FBQ0UsUUFBUUMsR0FBRyxDQUFDQyxnQkFBZ0IsSUFBSSxDQUFDRixRQUFRQyxHQUFHLENBQUNFLG9CQUFvQixFQUFFO0lBQ3RFQyxRQUFRQyxJQUFJLENBQUM7QUFDZjtBQUVBLE1BQU1DLGNBQWM7SUFDbEJDLFdBQVc7UUFDVFIsc0VBQWNBLENBQUM7WUFDYlMsVUFBVVIsUUFBUUMsR0FBRyxDQUFDQyxnQkFBZ0IsSUFBSTtZQUMxQ08sY0FBY1QsUUFBUUMsR0FBRyxDQUFDRSxvQkFBb0IsSUFBSTtZQUNsRE8sZUFBZTtnQkFDYkMsUUFBUTtvQkFDTkMsUUFBUTtvQkFDUkMsYUFBYTtvQkFDYkMsZUFBZTtnQkFDakI7WUFDRjtRQUNGO0tBQ0Q7SUFFREMsT0FBTztRQUNMQyxRQUFRO1FBQ1JDLE9BQU87SUFDVDtJQUVBQyxXQUFXO1FBQ1QsTUFBTUYsUUFBTyxFQUFFRyxJQUFJLEVBQUVDLE9BQU8sRUFBRUMsT0FBTyxFQUFFO1lBQ3JDLDREQUE0RDtZQUM1RCxPQUFPO1FBQ1Q7UUFFQSxNQUFNQyxLQUFJLEVBQUVDLEtBQUssRUFBRUosSUFBSSxFQUFFQyxPQUFPLEVBQUVDLE9BQU8sRUFBRTtZQUN6QyxJQUFJRixNQUFNO2dCQUNSSSxNQUFNQyxFQUFFLEdBQUdMLEtBQUtLLEVBQUU7Z0JBQ2xCRCxNQUFNRSxLQUFLLEdBQUdOLEtBQUtNLEtBQUs7Z0JBQ3hCRixNQUFNRyxJQUFJLEdBQUdQLEtBQUtPLElBQUk7WUFDeEI7WUFDQSxPQUFPSDtRQUNUO1FBRUEsTUFBTUksU0FBUSxFQUFFQSxPQUFPLEVBQUVKLEtBQUssRUFBRTtZQUM5QixJQUFJQSxPQUFPO2dCQUNUSSxRQUFRUixJQUFJLENBQUNLLEVBQUUsR0FBR0QsTUFBTUMsRUFBRTtnQkFDMUJHLFFBQVFSLElBQUksQ0FBQ00sS0FBSyxHQUFHRixNQUFNRSxLQUFLO2dCQUNoQ0UsUUFBUVIsSUFBSSxDQUFDTyxJQUFJLEdBQUdILE1BQU1HLElBQUk7WUFDaEM7WUFDQSxPQUFPQztRQUNUO1FBRUEsTUFBTUMsVUFBUyxFQUFFQyxHQUFHLEVBQUVDLE9BQU8sRUFBRTtZQUM3QiwyREFBMkQ7WUFDM0QsSUFBSUQsUUFBUUMsV0FBV0QsUUFBUSxDQUFDLEVBQUVDLFFBQVEsTUFBTSxDQUFDLEVBQUU7Z0JBQ2pELE9BQU8sQ0FBQyxFQUFFQSxRQUFRLGNBQWMsQ0FBQztZQUNuQztZQUVBLHVDQUF1QztZQUN2QyxJQUFJRCxJQUFJRSxVQUFVLENBQUNELFVBQVU7Z0JBQzNCLE9BQU9EO1lBQ1Q7WUFFQSwyQkFBMkI7WUFDM0IsT0FBTyxDQUFDLEVBQUVDLFFBQVEsY0FBYyxDQUFDO1FBQ25DO0lBQ0Y7SUFFQUgsU0FBUztRQUNQSyxVQUFVO1FBQ1ZDLFFBQVEsS0FBSyxLQUFLLEtBQUs7SUFDekI7SUFFQUMsUUFBUWxDLFFBQVFDLEdBQUcsQ0FBQ2tDLGVBQWU7SUFFbkNDLE9BQU9wQyxrQkFBeUI7QUFDbEM7QUFFQSxNQUFNcUMsVUFBVXZDLGdEQUFRQSxDQUFDUTtBQUVrQiIsInNvdXJjZXMiOlsid2VicGFjazovL3RpbWVwdWxzZS1uZXh0anMvLi9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUuanM/MjMyZCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTmV4dEF1dGggZnJvbSBcIm5leHQtYXV0aFwiO1xyXG5pbXBvcnQgR29vZ2xlUHJvdmlkZXIgZnJvbSBcIm5leHQtYXV0aC9wcm92aWRlcnMvZ29vZ2xlXCI7XHJcblxyXG4vLyBWYWxpZGF0ZSBlbnZpcm9ubWVudCB2YXJpYWJsZXNcclxuaWYgKCFwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX0lEIHx8ICFwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX1NFQ1JFVCkge1xyXG4gIGNvbnNvbGUud2Fybign4pqg77iPIEdvb2dsZSBPQXV0aCBjcmVkZW50aWFscyBub3QgY29uZmlndXJlZC4gUGxlYXNlIHNldCBHT09HTEVfQ0xJRU5UX0lEIGFuZCBHT09HTEVfQ0xJRU5UX1NFQ1JFVCBpbiAuZW52LmxvY2FsJyk7XHJcbn1cclxuXHJcbmNvbnN0IGF1dGhPcHRpb25zID0ge1xyXG4gIHByb3ZpZGVyczogW1xyXG4gICAgR29vZ2xlUHJvdmlkZXIoe1xyXG4gICAgICBjbGllbnRJZDogcHJvY2Vzcy5lbnYuR09PR0xFX0NMSUVOVF9JRCB8fCAnJyxcclxuICAgICAgY2xpZW50U2VjcmV0OiBwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX1NFQ1JFVCB8fCAnJyxcclxuICAgICAgYXV0aG9yaXphdGlvbjoge1xyXG4gICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgcHJvbXB0OiBcImNvbnNlbnRcIixcclxuICAgICAgICAgIGFjY2Vzc190eXBlOiBcIm9mZmxpbmVcIixcclxuICAgICAgICAgIHJlc3BvbnNlX3R5cGU6IFwiY29kZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KSxcclxuICBdLFxyXG4gIFxyXG4gIHBhZ2VzOiB7XHJcbiAgICBzaWduSW46ICcvbG9naW4nLFxyXG4gICAgZXJyb3I6ICcvbG9naW4nLFxyXG4gIH0sXHJcbiAgXHJcbiAgY2FsbGJhY2tzOiB7XHJcbiAgICBhc3luYyBzaWduSW4oeyB1c2VyLCBhY2NvdW50LCBwcm9maWxlIH0pIHtcclxuICAgICAgLy8gQWx3YXlzIGFsbG93IHNpZ24gaW4sIHdlJ2xsIGhhbmRsZSB1c2VyIGNoZWNrIGluIHJlZGlyZWN0XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgYXN5bmMgand0KHsgdG9rZW4sIHVzZXIsIGFjY291bnQsIHByb2ZpbGUgfSkge1xyXG4gICAgICBpZiAodXNlcikge1xyXG4gICAgICAgIHRva2VuLmlkID0gdXNlci5pZDtcclxuICAgICAgICB0b2tlbi5lbWFpbCA9IHVzZXIuZW1haWw7XHJcbiAgICAgICAgdG9rZW4ubmFtZSA9IHVzZXIubmFtZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdG9rZW47XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBhc3luYyBzZXNzaW9uKHsgc2Vzc2lvbiwgdG9rZW4gfSkge1xyXG4gICAgICBpZiAodG9rZW4pIHtcclxuICAgICAgICBzZXNzaW9uLnVzZXIuaWQgPSB0b2tlbi5pZDtcclxuICAgICAgICBzZXNzaW9uLnVzZXIuZW1haWwgPSB0b2tlbi5lbWFpbDtcclxuICAgICAgICBzZXNzaW9uLnVzZXIubmFtZSA9IHRva2VuLm5hbWU7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHNlc3Npb247XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBhc3luYyByZWRpcmVjdCh7IHVybCwgYmFzZVVybCB9KSB7XHJcbiAgICAgIC8vIElmIHJlZGlyZWN0aW5nIHRvIGJhc2UgVVJMIG9yIGxvZ2luLCBnbyB0byBhdXRoIGNhbGxiYWNrXHJcbiAgICAgIGlmICh1cmwgPT09IGJhc2VVcmwgfHwgdXJsID09PSBgJHtiYXNlVXJsfS9sb2dpbmApIHtcclxuICAgICAgICByZXR1cm4gYCR7YmFzZVVybH0vYXV0aC9jYWxsYmFja2A7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIElmIFVSTCBzdGFydHMgd2l0aCBiYXNlVXJsLCBhbGxvdyBpdFxyXG4gICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoYmFzZVVybCkpIHtcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBEZWZhdWx0IHRvIGF1dGggY2FsbGJhY2tcclxuICAgICAgcmV0dXJuIGAke2Jhc2VVcmx9L2F1dGgvY2FsbGJhY2tgO1xyXG4gICAgfSxcclxuICB9LFxyXG4gIFxyXG4gIHNlc3Npb246IHtcclxuICAgIHN0cmF0ZWd5OiBcImp3dFwiLFxyXG4gICAgbWF4QWdlOiAzMCAqIDI0ICogNjAgKiA2MCwgLy8gMzAgZGF5c1xyXG4gIH0sXHJcbiAgXHJcbiAgc2VjcmV0OiBwcm9jZXNzLmVudi5ORVhUQVVUSF9TRUNSRVQsXHJcbiAgXHJcbiAgZGVidWc6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnLFxyXG59O1xyXG5cclxuY29uc3QgaGFuZGxlciA9IE5leHRBdXRoKGF1dGhPcHRpb25zKTtcclxuXHJcbmV4cG9ydCB7IGhhbmRsZXIgYXMgR0VULCBoYW5kbGVyIGFzIFBPU1QgfTtcclxuIl0sIm5hbWVzIjpbIk5leHRBdXRoIiwiR29vZ2xlUHJvdmlkZXIiLCJwcm9jZXNzIiwiZW52IiwiR09PR0xFX0NMSUVOVF9JRCIsIkdPT0dMRV9DTElFTlRfU0VDUkVUIiwiY29uc29sZSIsIndhcm4iLCJhdXRoT3B0aW9ucyIsInByb3ZpZGVycyIsImNsaWVudElkIiwiY2xpZW50U2VjcmV0IiwiYXV0aG9yaXphdGlvbiIsInBhcmFtcyIsInByb21wdCIsImFjY2Vzc190eXBlIiwicmVzcG9uc2VfdHlwZSIsInBhZ2VzIiwic2lnbkluIiwiZXJyb3IiLCJjYWxsYmFja3MiLCJ1c2VyIiwiYWNjb3VudCIsInByb2ZpbGUiLCJqd3QiLCJ0b2tlbiIsImlkIiwiZW1haWwiLCJuYW1lIiwic2Vzc2lvbiIsInJlZGlyZWN0IiwidXJsIiwiYmFzZVVybCIsInN0YXJ0c1dpdGgiLCJzdHJhdGVneSIsIm1heEFnZSIsInNlY3JldCIsIk5FWFRBVVRIX1NFQ1JFVCIsImRlYnVnIiwiaGFuZGxlciIsIkdFVCIsIlBPU1QiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/auth/[...nextauth]/route.js\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/uuid","vendor-chunks/oauth","vendor-chunks/@panva","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/preact","vendor-chunks/oidc-token-hash","vendor-chunks/object-hash","vendor-chunks/lru-cache","vendor-chunks/cookie"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=D%3A%5Cselsoft%5CWebApp%5CTimePulse%5Cnextjs-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Cselsoft%5CWebApp%5CTimePulse%5Cnextjs-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();