"use client";
import React from "react";
import "./globals.css";
import { usePathname } from "next/navigation";
import { Provider as ReduxProvider } from "react-redux";
import store from "@/stores/store";
import WebSocketProvider from "@/providers/WebsocketProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PageAnimatePresence from "@/app/components/HOC/PageAnimatePresence";
import Header from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-1000`}
        id="page-container"
      >
        <ReduxProvider store={store}>
          <WebSocketProvider>
            <main>
              <PageAnimatePresence>{children}</PageAnimatePresence>
            </main>
          </WebSocketProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
