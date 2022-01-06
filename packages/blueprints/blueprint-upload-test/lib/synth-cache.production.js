/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./blueprint.js":
/*!**********************!*\
  !*** ./blueprint.js ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.Blueprint = void 0;\nconst caws_blueprint_1 = __webpack_require__(/*! @caws-blueprint/caws.blueprint */ \"../../blueprint/lib/index.js\");\nconst defaults_json_1 = __importDefault(__webpack_require__(/*! ./defaults.json */ \"./defaults.json\"));\n/**\n * This is the actual blueprint class.\n * 1. This MUST be the only 'class' exported, as 'Blueprint'\n * 2. This Blueprint should extend another ParentBlueprint\n */\nclass Blueprint extends caws_blueprint_1.Blueprint {\n    constructor(options_) {\n        super(options_);\n        const options = Object.assign(defaults_json_1.default, options_);\n        console.log(options);\n    }\n}\nexports.Blueprint = Blueprint;\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmx1ZXByaW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2JsdWVwcmludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxtRUFBd0c7QUFDeEcsb0VBQXVDO0FBYXZDOzs7O0dBSUc7QUFDSCxNQUFhLFNBQVUsU0FBUSwwQkFBZTtJQUM1QyxZQUFZLFFBQWlCO1FBQzNCLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLHVCQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2QixDQUFDO0NBQ0Y7QUFORCw4QkFNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJsdWVwcmludCBhcyBQYXJlbnRCbHVlcHJpbnQsIE9wdGlvbnMgYXMgUGFyZW50T3B0aW9ucyB9IGZyb20gJ0BjYXdzLWJsdWVwcmludC9jYXdzLmJsdWVwcmludCc7XG5pbXBvcnQgZGVmYXVsdHMgZnJvbSAnLi9kZWZhdWx0cy5qc29uJztcblxuLyoqXG4gKiBUaGlzIGlzIHRoZSAnT3B0aW9ucycgaW50ZXJmYWNlLiBUaGUgJ09wdGlvbnMnIGludGVyZmFjZSBpcyBpbnRlcnByZXRlZCBieSB0aGUgd2l6YXJkIHRvIGR5bmFtaWNhbGx5IGdlbmVyYXRlIGEgc2VsZWN0aW9uIFVJLlxuICogMS4gSXQgTVVTVCBiZSBjYWxsZWQgJ09wdGlvbnMnIGluIG9yZGVyIHRvIGJlIGludGVycHJldGVkIGJ5IHRoZSB3aXphcmRcbiAqIDIuIFRoaXMgaXMgaG93IHlvdSBjb250cm9sIHRoZSBmaWVsZHMgdGhhdCBzaG93IHVwIG9uIGEgd2l6YXJkIHNlbGVjdGlvbiBwYW5lbC4gS2VlcGluZyB0aGlzIHNtYWxsIGxlYWRzIHRvIGEgYmV0dGVyIHVzZXIgZXhwZXJpZW5jZS5cbiAqIDMuIFlvdSBjYW4gdXNlIEpTRE9DcyBhbmQgYW5ub3RhdGlvbnMgc3VjaCBhczogJz8nLCBAYWR2YW5jZWQsIEBoaWRkZW4sIEBkaXNwbGF5IC0gdGV4dGFyZWEsIGV0Yy4gdG8gY29udHJvbCBob3cgdGhlIHdpemFyZCBkaXNwbGF5cyBjZXJ0YWluIGZpZWxkcy5cbiAqIDQuIEFsbCByZXF1aXJlZCBtZW1iZXJzIG9mICdPcHRpb25zJyBtdXN0IGJlIGRlZmluZWQgaW4gJ2RlZmF1bHRzLmpzb24nIHRvIHN5bnRoIHlvdXIgYmx1ZXByaW50IGxvY2FsbHlcbiAqIDUuIFRoZSAnT3B0aW9ucycgbWVtYmVyIHZhbHVlcyBkZWZpbmVkIGluICdkZWZhdWx0cy5qc29uJyB3aWxsIGJlIHVzZWQgdG8gcG9wdWxhdGUgdGhlIHdpemFyZCBzZWxlY3Rpb24gcGFuZWwgd2l0aCBkZWZhdWx0IHZhbHVlc1xuICovXG5leHBvcnQgaW50ZXJmYWNlIE9wdGlvbnMgZXh0ZW5kcyBQYXJlbnRPcHRpb25zIHtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBhY3R1YWwgYmx1ZXByaW50IGNsYXNzLlxuICogMS4gVGhpcyBNVVNUIGJlIHRoZSBvbmx5ICdjbGFzcycgZXhwb3J0ZWQsIGFzICdCbHVlcHJpbnQnXG4gKiAyLiBUaGlzIEJsdWVwcmludCBzaG91bGQgZXh0ZW5kIGFub3RoZXIgUGFyZW50Qmx1ZXByaW50XG4gKi9cbmV4cG9ydCBjbGFzcyBCbHVlcHJpbnQgZXh0ZW5kcyBQYXJlbnRCbHVlcHJpbnQge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zXzogT3B0aW9ucykge1xuICAgIHN1cGVyKG9wdGlvbnNfKTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihkZWZhdWx0cywgb3B0aW9uc18pO1xuICAgIGNvbnNvbGUubG9nKG9wdGlvbnMpO1xuICB9XG59XG4iXX0=\n\n//# sourceURL=webpack:///./blueprint.js?");

/***/ }),

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";
eval("\nvar __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });\n}) : (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n}));\nvar __exportStar = (this && this.__exportStar) || function(m, exports) {\n    for (var p in m) if (p !== \"default\" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);\n};\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.defaults = void 0;\n__exportStar(__webpack_require__(/*! ./blueprint */ \"./blueprint.js\"), exports);\nconst defaults_json_1 = __importDefault(__webpack_require__(/*! ./defaults.json */ \"./defaults.json\"));\nexports.defaults = defaults_json_1.default;\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDhDQUE0QjtBQUM1QixvRUFBd0M7QUFDM0IsUUFBQSxRQUFRLEdBQUcsdUJBQVMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuZXhwb3J0ICogZnJvbSAnLi9ibHVlcHJpbnQnO1xuaW1wb3J0IGRlZmF1bHRzXyBmcm9tICcuL2RlZmF1bHRzLmpzb24nO1xuZXhwb3J0IGNvbnN0IGRlZmF1bHRzID0gZGVmYXVsdHNfO1xuIl19\n\n//# sourceURL=webpack:///./index.js?");

/***/ }),

/***/ "./synth-driver.js":
/*!*************************!*\
  !*** ./synth-driver.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

eval("const { Blueprint } = __webpack_require__(/*! ././index.js */ \"./index.js\");\n\n// ============================\n// ============================\n// Synthetization\n// ============================\n(() => {\n  // node cached-synth.js '{options-selected}' 'outputDirectory'\n  const options = JSON.parse(process.argv[2]);\n  const outputdir = process.argv[3];\n\n  console.log(\"===== Starting synthesis ===== \");\n  console.log(\"options: \", options);\n  console.log(\"outputDir: \", outputdir);\n\n  new Blueprint({\n    ...options,\n    outdir: outputdir\n  }).synth();\n  console.log(\"===== Ending synthesis ===== \");\n})();\n\n//# sourceURL=webpack:///./synth-driver.js?");

/***/ }),

/***/ "../../blueprint/lib/blueprint.js":
/*!****************************************!*\
  !*** ../../blueprint/lib/blueprint.js ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";
eval("\nvar __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });\n}) : (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n}));\nvar __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {\n    Object.defineProperty(o, \"default\", { enumerable: true, value: v });\n}) : function(o, v) {\n    o[\"default\"] = v;\n});\nvar __importStar = (this && this.__importStar) || function (mod) {\n    if (mod && mod.__esModule) return mod;\n    var result = {};\n    if (mod != null) for (var k in mod) if (k !== \"default\" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);\n    __setModuleDefault(result, mod);\n    return result;\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.Blueprint = void 0;\n/* eslint-disable @typescript-eslint/no-empty-function */\nconst path = __importStar(__webpack_require__(/*! path */ \"path\"));\nconst projen_1 = __webpack_require__(/*! projen */ \"projen\");\nclass Blueprint extends projen_1.Project {\n    constructor(options) {\n        var _a;\n        super({\n            name: 'CodeAwsBlueprint',\n            ...options,\n        });\n        this.context = {\n            rootDir: path.resolve(this.outdir),\n            organizationName: process.env.CONTEXT_ORGANIZATIONNAME,\n            projectName: process.env.CONTEXT_PROJECTNAME,\n            npmConfiguration: {\n                token: process.env.NPM_CONFIG_TOKEN,\n                registry: (_a = process.env.NPM_CONFIG_REGISTRY) !== null && _a !== void 0 ? _a : 'https://template-721779663932.d.codeartifact.us-west-2.amazonaws.com/npm/global-templates/',\n            },\n        };\n        for (const component of this.components) {\n            component.synthesize = () => { };\n        }\n    }\n}\nexports.Blueprint = Blueprint;\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmx1ZXByaW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2JsdWVwcmludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseURBQXlEO0FBQ3pELDJDQUE2QjtBQUU3QixtQ0FBaUM7QUFXakMsTUFBYSxTQUFVLFNBQVEsZ0JBQU87SUFHcEMsWUFBWSxPQUFnQjs7UUFDMUIsS0FBSyxDQUFDO1lBQ0osSUFBSSxFQUFFLGtCQUFrQjtZQUN4QixHQUFHLE9BQU87U0FDWCxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsT0FBTyxHQUFHO1lBQ2IsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QjtZQUN0RCxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7WUFDNUMsZ0JBQWdCLEVBQUU7Z0JBQ2hCLEtBQUssRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQjtnQkFDbkMsUUFBUSxFQUNOLE1BQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsbUNBQy9CLDRGQUE0RjthQUMvRjtTQUNGLENBQUM7UUFFRixLQUFLLE1BQU0sU0FBUyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDdkMsU0FBUyxDQUFDLFVBQVUsR0FBRyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUM7U0FDakM7SUFDSCxDQUFDO0NBQ0Y7QUF6QkQsOEJBeUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uICovXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgeyBQcm9qZWN0IH0gZnJvbSAncHJvamVuJztcbmltcG9ydCB7IENvbnRleHQgfSBmcm9tICcuL2NvbnRleHQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhcmVudE9wdGlvbnMge1xuICBvdXRkaXI6IHN0cmluZztcbiAgcGFyZW50PzogUHJvamVjdDtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1pbnRlcmZhY2VcbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyBleHRlbmRzIFBhcmVudE9wdGlvbnMge31cblxuZXhwb3J0IGNsYXNzIEJsdWVwcmludCBleHRlbmRzIFByb2plY3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgY29udGV4dDogQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgbmFtZTogJ0NvZGVBd3NCbHVlcHJpbnQnLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICB9KTtcblxuICAgIHRoaXMuY29udGV4dCA9IHtcbiAgICAgIHJvb3REaXI6IHBhdGgucmVzb2x2ZSh0aGlzLm91dGRpciksXG4gICAgICBvcmdhbml6YXRpb25OYW1lOiBwcm9jZXNzLmVudi5DT05URVhUX09SR0FOSVpBVElPTk5BTUUsXG4gICAgICBwcm9qZWN0TmFtZTogcHJvY2Vzcy5lbnYuQ09OVEVYVF9QUk9KRUNUTkFNRSxcbiAgICAgIG5wbUNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgdG9rZW46IHByb2Nlc3MuZW52Lk5QTV9DT05GSUdfVE9LRU4sXG4gICAgICAgIHJlZ2lzdHJ5OlxuICAgICAgICAgIHByb2Nlc3MuZW52Lk5QTV9DT05GSUdfUkVHSVNUUlkgPz9cbiAgICAgICAgICAnaHR0cHM6Ly90ZW1wbGF0ZS03MjE3Nzk2NjM5MzIuZC5jb2RlYXJ0aWZhY3QudXMtd2VzdC0yLmFtYXpvbmF3cy5jb20vbnBtL2dsb2JhbC10ZW1wbGF0ZXMvJyxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50cykge1xuICAgICAgY29tcG9uZW50LnN5bnRoZXNpemUgPSAoKSA9PiB7fTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==\n\n//# sourceURL=webpack:///../../blueprint/lib/blueprint.js?");

/***/ }),

/***/ "../../blueprint/lib/context.js":
/*!**************************************!*\
  !*** ../../blueprint/lib/context.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgaW50ZXJmYWNlIE5wbUNvbmZpZ3VyYXRpb24ge1xuICByZWFkb25seSByZWdpc3RyeT86IHN0cmluZztcbiAgcmVhZG9ubHkgdG9rZW4/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29udGV4dCB7XG4gIHJlYWRvbmx5IG9yZ2FuaXphdGlvbk5hbWU/OiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb2plY3ROYW1lPzogc3RyaW5nO1xuICByZWFkb25seSByb290RGlyOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG5wbUNvbmZpZ3VyYXRpb246IE5wbUNvbmZpZ3VyYXRpb247XG59XG4iXX0=\n\n//# sourceURL=webpack:///../../blueprint/lib/context.js?");

/***/ }),

/***/ "../../blueprint/lib/index.js":
/*!************************************!*\
  !*** ../../blueprint/lib/index.js ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";
eval("\nvar __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });\n}) : (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n}));\nvar __exportStar = (this && this.__exportStar) || function(m, exports) {\n    for (var p in m) if (p !== \"default\" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);\n};\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.defaults = void 0;\n__exportStar(__webpack_require__(/*! ./blueprint */ \"../../blueprint/lib/blueprint.js\"), exports);\n__exportStar(__webpack_require__(/*! ./context */ \"../../blueprint/lib/context.js\"), exports);\nconst defaults_json_1 = __importDefault(__webpack_require__(/*! ./defaults.json */ \"../../blueprint/lib/defaults.json\"));\nexports.defaults = defaults_json_1.default;\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDhDQUE0QjtBQUM1Qiw0Q0FBMEI7QUFFMUIsb0VBQXdDO0FBQzNCLFFBQUEsUUFBUSxHQUFHLHVCQUFTLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgKiBmcm9tICcuL2JsdWVwcmludCc7XG5leHBvcnQgKiBmcm9tICcuL2NvbnRleHQnO1xuXG5pbXBvcnQgZGVmYXVsdHNfIGZyb20gJy4vZGVmYXVsdHMuanNvbic7XG5leHBvcnQgY29uc3QgZGVmYXVsdHMgPSBkZWZhdWx0c187XG4iXX0=\n\n//# sourceURL=webpack:///../../blueprint/lib/index.js?");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "projen":
/*!*************************!*\
  !*** external "projen" ***!
  \*************************/
/***/ ((module) => {

"use strict";
const projen = require('projen'); module.exports = projen;

/***/ }),

/***/ "./defaults.json":
/*!***********************!*\
  !*** ./defaults.json ***!
  \***********************/
/***/ ((module) => {

"use strict";
eval("module.exports = {};\n\n//# sourceURL=webpack:///./defaults.json?");

/***/ }),

/***/ "../../blueprint/lib/defaults.json":
/*!*****************************************!*\
  !*** ../../blueprint/lib/defaults.json ***!
  \*****************************************/
/***/ ((module) => {

"use strict";
eval("module.exports = {};\n\n//# sourceURL=webpack:///../../blueprint/lib/defaults.json?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./synth-driver.js");
/******/ 	
/******/ })()
;