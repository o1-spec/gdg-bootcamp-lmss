#!/usr/bin/env bash
# scripts/smoke-test.sh — Full MVP E2E smoke test

BASE="http://localhost:3000"
PASS=0
FAIL=0
BUGS=""

log_pass() { echo "  ✅ PASS: $1"; PASS=$((PASS+1)); }
log_fail() { echo "  ❌ FAIL: $1"; FAIL=$((FAIL+1)); BUGS="$BUGS\n    - $1"; }
log_info() { echo "  ℹ️  $1"; }
log_section() { echo ""; echo "══════════════════════════════════════"; echo "  $1"; echo "══════════════════════════════════════"; }

do_login() {
  local email="$1" password="$2" jar="$3"
  curl -s -c "$jar" -b "$jar" -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
    -w "\nHTTP_CODE:%{http_code}" | grep "HTTP_CODE:" | cut -d: -f2
}

auth_get() {
  local jar="$1" url="$2"
  curl -s -c "$jar" -b "$jar" -o /dev/null -w "%{http_code}" "$BASE$url"
}

auth_get_body() {
  local jar="$1" url="$2"
  curl -s -c "$jar" -b "$jar" "$BASE$url"
}

unauth_get() {
  curl -s -o /dev/null -w "%{http_code}" "$BASE$1"
}

TMPDIR_SMOKE=$(mktemp -d)
STUDENT_JAR="$TMPDIR_SMOKE/student.cookies"
INSTRUCTOR_JAR="$TMPDIR_SMOKE/instructor.cookies"
ADMIN_JAR="$TMPDIR_SMOKE/admin.cookies"
BAD_JAR="$TMPDIR_SMOKE/bad.cookies"

echo ""
echo "🔬 BOOTCAMP LMS MVP SMOKE TEST — $(date)"
echo "   Server: $BASE"

# ── 1. AUTH LOGIN ──────────────────────────────────────────────────────────
log_section "1. AUTH — LOGIN"

code=$(do_login "student@example.com" "Password123!" "$STUDENT_JAR")
if [ "$code" = "200" ]; then log_pass "Student login (200)"; else log_fail "Student login expected 200, got $code"; fi

code=$(do_login "instructor@example.com" "Password123!" "$INSTRUCTOR_JAR")
if [ "$code" = "200" ]; then log_pass "Instructor login (200)"; else log_fail "Instructor login expected 200, got $code"; fi

code=$(do_login "admin@example.com" "Password123!" "$ADMIN_JAR")
if [ "$code" = "200" ]; then log_pass "Admin login (200)"; else log_fail "Admin login expected 200, got $code"; fi

code=$(do_login "student@example.com" "WrongPassword!" "$BAD_JAR")
if [ "$code" = "401" ]; then log_pass "Bad password rejected (401)"; else log_fail "Bad password should be 401, got $code"; fi

code=$(unauth_get "/api/auth/me")
if [ "$code" = "401" ]; then log_pass "Unauthenticated /api/auth/me → 401"; else log_fail "/api/auth/me unauth expected 401, got $code"; fi

code=$(auth_get "$STUDENT_JAR" "/api/auth/me")
if [ "$code" = "200" ]; then log_pass "Student /api/auth/me → 200"; else log_fail "Student /api/auth/me expected 200, got $code"; fi

# ── 2. SECURITY — ROLE ISOLATION ─────────────────────────────────────────
log_section "2. SECURITY — ROLE ISOLATION"

# Student → admin routes
code=$(auth_get "$STUDENT_JAR" "/admin/dashboard")
if [ "$code" = "307" ] || [ "$code" = "302" ]; then
  log_pass "Student /admin/dashboard → redirect ($code)"
else
  log_fail "Student /admin/dashboard expected redirect, got $code"
fi

code=$(auth_get "$STUDENT_JAR" "/instructor/dashboard")
if [ "$code" = "307" ] || [ "$code" = "302" ]; then
  log_pass "Student /instructor/dashboard → redirect ($code)"
else
  log_fail "Student /instructor/dashboard expected redirect, got $code"
fi

# Instructor → admin routes
code=$(auth_get "$INSTRUCTOR_JAR" "/admin/dashboard")
if [ "$code" = "307" ] || [ "$code" = "302" ]; then
  log_pass "Instructor /admin/dashboard → redirect ($code)"
else
  log_fail "Instructor /admin/dashboard expected redirect, got $code"
fi

# Student cannot call CSV export API
code=$(auth_get "$STUDENT_JAR" "/api/attendance/export?sessionId=test")
if [ "$code" = "401" ] || [ "$code" = "403" ]; then
  log_pass "Student blocked from CSV export ($code)"
else
  log_fail "Student CSV export expected 401/403, got $code"
fi

# Unauthenticated export call
code=$(unauth_get "/api/attendance/export?sessionId=test")
if [ "$code" = "401" ] || [ "$code" = "403" ]; then
  log_pass "Unauthenticated CSV export blocked ($code)"
else
  log_fail "Unauthenticated CSV export expected 401/403, got $code"
fi

# ── 3. STUDENT FLOW ──────────────────────────────────────────────────────
log_section "3. STUDENT FLOW"

for path in "/dashboard" "/classes" "/attendance" "/assignments" "/progress" "/announcements"; do
  code=$(auth_get "$STUDENT_JAR" "$path")
  if [ "$code" = "200" ]; then log_pass "Student $path → 200"; else log_fail "Student $path expected 200, got $code"; fi
done

# Check student me body doesn't expose passwordHash
me_body=$(auth_get_body "$STUDENT_JAR" "/api/auth/me")
if echo "$me_body" | grep -q "passwordHash"; then
  log_fail "/api/auth/me leaks passwordHash to student"
else
  log_pass "/api/auth/me does not expose passwordHash"
fi

# ── 4. INSTRUCTOR FLOW ───────────────────────────────────────────────────
log_section "4. INSTRUCTOR FLOW"

for path in "/instructor/dashboard" "/instructor/classes" "/instructor/students" "/instructor/assignments" "/instructor/attendance" "/instructor/grading" "/instructor/progress" "/instructor/announcements"; do
  code=$(auth_get "$INSTRUCTOR_JAR" "$path")
  if [ "$code" = "200" ]; then log_pass "Instructor $path → 200"; else log_fail "Instructor $path expected 200, got $code"; fi
done

# ── 5. ADMIN FLOW ────────────────────────────────────────────────────────
log_section "5. ADMIN FLOW"

for path in "/admin/dashboard" "/admin/cohorts" "/admin/tracks" "/admin/students" "/admin/instructors" "/admin/enrollments" "/admin/classes" "/admin/attendance" "/admin/assignments" "/admin/grading" "/admin/announcements" "/admin/progress"; do
  code=$(auth_get "$ADMIN_JAR" "$path")
  if [ "$code" = "200" ]; then log_pass "Admin $path → 200"; else log_fail "Admin $path expected 200, got $code"; fi
done

# ── 6. LOGOUT ───────────────────────────────────────────────────────────
log_section "6. LOGOUT"

for role_jar in "$STUDENT_JAR" "$INSTRUCTOR_JAR" "$ADMIN_JAR"; do
  code=$(curl -s -c "$role_jar" -b "$role_jar" -X POST "$BASE/api/auth/logout" -o /dev/null -w "%{http_code}")
  if [ "$code" = "200" ]; then log_pass "Logout → 200"; else log_fail "Logout expected 200, got $code"; fi
done

# ── 7. POST-LOGOUT INVALIDATION ──────────────────────────────────────────
log_section "7. POST-LOGOUT SESSION INVALIDATION"

code=$(auth_get "$STUDENT_JAR" "/api/auth/me")
if [ "$code" = "401" ]; then
  log_pass "Post-logout /api/auth/me → 401"
else
  log_fail "Post-logout /api/auth/me expected 401, got $code (stale session?)"
fi

# ── SUMMARY ─────────────────────────────────────────────────────────────
log_section "SUMMARY"
echo ""
echo "  PASSED: $PASS"
echo "  FAILED: $FAIL"
if [ -n "$BUGS" ]; then
  echo ""
  echo "  FAILURES:"
  echo -e "$BUGS"
fi

rm -rf "$TMPDIR_SMOKE"

if [ "$FAIL" -gt 0 ]; then exit 1; else exit 0; fi
