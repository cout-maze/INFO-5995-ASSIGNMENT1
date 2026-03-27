package com.example.mastg_test0016;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.graphics.Insets;
import androidx.core.view.OnApplyWindowInsetsListener;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

/* JADX INFO: loaded from: classes.dex */
public class Login extends AppCompatActivity {
    @Override // androidx.fragment.app.FragmentActivity, androidx.activity.ComponentActivity, androidx.core.app.ComponentActivity, android.app.Activity
    protected void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_login);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), new OnApplyWindowInsetsListener() { // from class: com.example.mastg_test0016.Login$$ExternalSyntheticLambda0
            @Override // androidx.core.view.OnApplyWindowInsetsListener
            public final WindowInsetsCompat onApplyWindowInsets(View view, WindowInsetsCompat windowInsetsCompat) {
                return Login.lambda$onCreate$0(view, windowInsetsCompat);
            }
        });
        setSupportActionBar((Toolbar) findViewById(R.id.toolbar2));
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        final EditText editText = (EditText) findViewById(R.id.editTextText2);
        final EditText editText2 = (EditText) findViewById(R.id.editTextTextPassword2);
        ((Button) findViewById(R.id.button2)).setOnClickListener(new View.OnClickListener() { // from class: com.example.mastg_test0016.Login.1
            @Override // android.view.View.OnClickListener
            public void onClick(View view) throws Throwable {
                boolean zCheckCredentials = Login.this.checkCredentials(editText.getText().toString(), editText2.getText().toString());
                Log.d("result func:", "" + zCheckCredentials);
                if (!zCheckCredentials) {
                    Toast.makeText(Login.this, "Wrong Credential", 0).show();
                    return;
                }
                Login.this.createSession();
                Login.this.startActivity(new Intent(Login.this, (Class<?>) Profile.class));
            }
        });
    }

    static /* synthetic */ WindowInsetsCompat lambda$onCreate$0(View view, WindowInsetsCompat windowInsetsCompat) {
        Insets insets = windowInsetsCompat.getInsets(WindowInsetsCompat.Type.systemBars());
        view.setPadding(insets.left, insets.top, insets.right, insets.bottom);
        return windowInsetsCompat;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public boolean checkCredentials(String str, String str2) throws Throwable {
        try {
            return SecurityUtils.checkCredential(this, str, str2);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public void createSession() {
        try {
            String token = SecurityUtils.generateSessionToken();
            SecurityUtils.storeSessionToken(this, token);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public String getSessionToken() {
        try {
            return SecurityUtils.getSessionToken(this);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
