package com.hanjamaster.app;

import android.os.Bundle;
import android.os.Message;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.app.Dialog;
import android.view.ViewGroup;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Ensure webview settings allow multiple windows (popups) and handle them properly
        this.bridge.getWebView().post(new Runnable() {
            @Override
            public void run() {
                WebView mainWebView = bridge.getWebView();
                WebSettings settings = mainWebView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
                settings.setSupportMultipleWindows(true);

                mainWebView.setWebChromeClient(new WebChromeClient() {
                    private Dialog popupDialog = null;

                    @Override
                    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                        WebView popupWebView = new WebView(MainActivity.this);
                        WebSettings popupSettings = popupWebView.getSettings();
                        popupSettings.setJavaScriptEnabled(true);
                        popupSettings.setJavaScriptCanOpenWindowsAutomatically(true);
                        popupSettings.setSupportMultipleWindows(true);

                        // Create dialog to display popupWebView in fullscreen
                        popupDialog = new Dialog(MainActivity.this, android.R.style.Theme_NoTitleBar_Fullscreen);
                        popupDialog.setContentView(popupWebView);
                        popupDialog.getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
                        popupDialog.show();

                        popupWebView.setWebChromeClient(new WebChromeClient() {
                            @Override
                            public void onCloseWindow(WebView window) {
                                if (popupDialog != null && popupDialog.isShowing()) {
                                    popupDialog.dismiss();
                                    popupDialog = null;
                                }
                            }
                        });

                        popupWebView.setWebViewClient(new WebViewClient() {
                            @Override
                            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                                return false; // Load inside popupWebView
                            }
                        });

                        WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                        transport.setWebView(popupWebView);
                        resultMsg.sendToTarget();
                        return true;
                    }

                    @Override
                    public void onCloseWindow(WebView window) {
                        if (popupDialog != null && popupDialog.isShowing()) {
                            popupDialog.dismiss();
                            popupDialog = null;
                        }
                        super.onCloseWindow(window);
                    }
                });
            }
        });
    }
}
