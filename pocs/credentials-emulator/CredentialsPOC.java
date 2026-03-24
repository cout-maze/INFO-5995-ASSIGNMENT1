import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;

/**
 * Demonstrates how plaintext credential lines written by the APK
 * can be parsed and extracted once the file is obtained.
 */
public class CredentialsPOC {
    public static void main(String[] args) throws IOException {
        String sample = "Username: alice Password: P@ssw0rd\n";
        BufferedReader br = new BufferedReader(new StringReader(sample));
        String line;
        while ((line = br.readLine()) != null) {
            String[] parts = line.split(" ");
            if (parts.length == 4 && "Username:".equals(parts[0]) && "Password:".equals(parts[2])) {
                String user = parts[1].trim();
                String pass = parts[3].trim();
                System.out.println("Recovered username: " + user);
                System.out.println("Recovered password: " + pass);
            }
        }
    }
}
