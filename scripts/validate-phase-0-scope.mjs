import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const scopeFilePath = path.join(rootDir, "governance/phase-0/scope-lock.json");

if (!fs.existsSync(scopeFilePath)) {
  console.error(`\nPHASE 0 VALIDATION FAILED: Missing ${scopeFilePath}\n`);
  process.exit(1);
}

let scope;
try {
  scope = JSON.parse(fs.readFileSync(scopeFilePath, "utf8"));
} catch (e) {
  console.error(`\nPHASE 0 VALIDATION FAILED: Invalid JSON in ${scopeFilePath}: ${e.message}\n`);
  process.exit(1);
}

const errors = [];
const requireLocked = process.argv.includes("--locked");

const requiredTopLevel = [
  "status",
  "launchTier",
  "jurisdiction",
  "launchModel",
  "mvpScope",
  "outOfScope",
  "signoffs"
];

for (const field of requiredTopLevel) {
  if (scope[field] === undefined || scope[field] === null || scope[field] === "") {
    errors.push(`Missing required field: ${field}`);
  }
}

// 1. Launch Tier
if (!scope.launchTier?.tier) {
  errors.push("Launch tier is not defined.");
}
if (!scope.launchTier?.grade || scope.launchTier.grade.trim() === "") {
  errors.push("Launch grade is not defined.");
}

// 2. Jurisdiction
if (!scope.jurisdiction?.country || scope.jurisdiction.country.trim() === "") {
  errors.push("Launch jurisdiction is not defined.");
}
if (!scope.jurisdiction?.framework || scope.jurisdiction.framework.trim() === "") {
  errors.push("Governing framework is not defined.");
}

// 3. Launch Model
if (!scope.launchModel || scope.launchModel.trim() === "") {
  errors.push("Launch model is not defined.");
} else if (!["B2B_SCHOOL_FIRST", "B2C_FAMILY_FIRST"].includes(scope.launchModel)) {
  errors.push(`Invalid launch model: ${scope.launchModel}. Must be B2B_SCHOOL_FIRST or B2C_FAMILY_FIRST.`);
}

// 4. Content / MVP Scope
if (!scope.mvpScope?.subject || scope.mvpScope.subject.trim() === "") {
  errors.push("MVP subject is not defined.");
}
if (!scope.mvpScope?.curriculum || scope.mvpScope.curriculum.trim() === "") {
  errors.push("Curriculum is not defined.");
}
if (!Array.isArray(scope.mvpScope?.topics) || scope.mvpScope.topics.length === 0) {
  errors.push("At least one MVP topic is required.");
}

// 5. Out of Scope
if (!Array.isArray(scope.outOfScope) || scope.outOfScope.length === 0) {
  errors.push("Out-of-scope list cannot be empty.");
}

// 6. Locked State Requirements
const isLocked = scope.status === "LOCKED" || requireLocked;

if (requireLocked && scope.status !== "LOCKED") {
  errors.push(`Phase 0 Gate requires status to be 'LOCKED', currently '${scope.status}'.`);
}

if (isLocked) {
  if (!scope.jurisdiction?.legalReviewComplete) {
    errors.push("A locked scope requires completed legal/compliance review.");
  }

  if (!scope.signoffs?.product) {
    errors.push("Missing required sign-off: product");
  }
  if (!scope.signoffs?.founder) {
    errors.push("Missing required sign-off: founder");
  }
  if (!scope.signoffs?.legal) {
    errors.push("Missing required sign-off: legal");
  }

  // Conditional B2B / B2C sign-off logic
  if (scope.launchModel === "B2B_SCHOOL_FIRST") {
    if (!scope.signoffs?.pilotPartner) {
      errors.push("B2B School-First model requires pilotPartner sign-off when locked.");
    }
  } else if (scope.launchModel === "B2C_FAMILY_FIRST") {
    if (!scope.pilotRecruitmentPlan || scope.pilotRecruitmentPlan.trim() === "") {
      errors.push("B2C Family-First model requires a non-empty pilotRecruitmentPlan.");
    }
  }
}

if (errors.length > 0) {
  console.error("\n❌ PHASE 0 VALIDATION FAILED\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error("");
  process.exit(1);
}

console.log(`\n✅ PHASE 0 VALIDATION PASSED [Status: ${scope.status}]`);
if (isLocked) {
  console.log("   Scope is formally LOCKED. Phase 1 implementation branch is AUTHORIZED.\n");
} else {
  console.log("   Scope is currently in DRAFT/IN_REVIEW. (Not yet locked for Phase 1 authorization).\n");
}
process.exit(0);
