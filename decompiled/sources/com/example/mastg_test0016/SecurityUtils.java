package com.example.mastg_test0016;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

final class SecurityUtils {
    private static final String PREFS_NAME = "secure_prefs";
    private static final String KEY_CREDENTIAL_PREFIX = "cred_";
    private static final String KEY_SESSION_TOKEN = "sessionToken";
    private static final int SALT_LENGTH = 16;
    private static final int ITERATIONS = 120000;
    private static final int KEY_LENGTH = 256;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private SecurityUtils() {
    }

    private static SharedPreferences getEncryptedPrefs(Context context) throws GeneralSecurityException, IOException {
        MasterKey masterKey = new MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();
        return EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        );
    }

    static void storeCredential(Context context, String username, String password)
            throws GeneralSecurityException, IOException {
        byte[] salt = new byte[SALT_LENGTH];
        SECURE_RANDOM.nextBytes(salt);
        byte[] hash = pbkdf2(password.toCharArray(), salt);
        String value = toBase64(salt) + ":" + toBase64(hash);
        getEncryptedPrefs(context).edit()
                .putString(KEY_CREDENTIAL_PREFIX + username, value)
                .apply();
    }

    static boolean checkCredential(Context context, String username, String password)
            throws GeneralSecurityException, IOException {
        String value = getEncryptedPrefs(context).getString(KEY_CREDENTIAL_PREFIX + username, null);
        if (value == null) {
            return false;
        }
        String[] parts = value.split(":", 2);
        if (parts.length != 2) {
            return false;
        }
        byte[] salt = fromBase64(parts[0]);
        byte[] expected = fromBase64(parts[1]);
        byte[] actual = pbkdf2(password.toCharArray(), salt);
        return Arrays.equals(expected, actual);
    }

    static String generateSessionToken() {
        byte[] token = new byte[32];
        SECURE_RANDOM.nextBytes(token);
        return toBase64(token);
    }

    static void storeSessionToken(Context context, String token)
            throws GeneralSecurityException, IOException {
        getEncryptedPrefs(context).edit().putString(KEY_SESSION_TOKEN, token).apply();
    }

    static String getSessionToken(Context context) throws GeneralSecurityException, IOException {
        return getEncryptedPrefs(context).getString(KEY_SESSION_TOKEN, null);
    }

    private static byte[] pbkdf2(char[] password, byte[] salt) throws GeneralSecurityException {
        PBEKeySpec spec = new PBEKeySpec(password, salt, ITERATIONS, KEY_LENGTH);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        return factory.generateSecret(spec).getEncoded();
    }

    private static String toBase64(byte[] data) {
        return Base64.encodeToString(data, Base64.NO_WRAP);
    }

    private static byte[] fromBase64(String data) {
        return Base64.decode(data, Base64.NO_WRAP);
    }
}
