# INFO5995 Assignment 1: AI-Assisted Cryptographic Vulnerability Discovery

This repository contains a static security analysis of `AssignmentRequirements/a1_case1 (1).apk`. After reviewing the assignment spec, rubric, decompiled source, and the existing findings, the deliverables were tightened to match what the APK actually does instead of overstating the exploit.

## Verified App Behavior

- `MainActivity` stores `Username: <user> Password: <pass>` in `credentials.txt` inside app-private storage.
- `Login.checkCredentials()` reads that file and validates the supplied username/password pair.
- `Login.createSession()` stores a 16-character `sessionToken` in `SharedPreferences` under `SessionPrefs`.
- `Login.generateSessionToken()` creates that token with `java.util.Random`, which is not suitable for session or authentication material.
- `Profile` clears the stored token on logout, but the shipped sample does not validate `sessionToken` before opening the screen. The report now states this limitation explicitly.

## Security Finding

The core finding is weak randomness in `com.example.mastg_test0016.Login.generateSessionToken()`. The token is intended to represent session state, but it is derived from `java.util.Random` rather than `java.security.SecureRandom`. That makes the design inappropriate for any value that may later be trusted as proof of authentication.

Static analysis found one other `Random` use in `MainActivity.randomNumberGenerator()`, but that method is not referenced elsewhere and does not protect a security-sensitive asset.


## Run the POC

Compile and run the proof of concept:

```bash
javac findings/SessionTokenPOC.java
java -cp findings SessionTokenPOC
```

The new POC keeps the APK's token-generation logic, injects a fixed seed for reproducibility, and brute-forces a small seed window to recover the same token. This demonstrates why `java.util.Random` is the wrong primitive for session material.

Example output from the executed run in this workspace:

```text
Simulated vulnerable token: blMdycOkq5ZDCHdO
Search window: [1735689598123, 1735689602123]
Recovered seed: 1735689600123
Predicted token: blMdycOkq5ZDCHdO
Attack successful: true
```

## Notes on Scope

This repository demonstrates the weak-randomness finding and a reproducible token-recovery workflow. It does not claim a full end-to-end authentication bypass against the shipped APK, because the current `Profile` activity never checks the stored token before rendering the protected screen.

## Fix Locations

The patched implementations are in:

- `decompiled/sources/com/example/mastg_test0016/SecurityUtils.java`
- `decompiled/sources/com/example/mastg_test0016/MainActivity.java`
- `decompiled/sources/com/example/mastg_test0016/Login.java`
