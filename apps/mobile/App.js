import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>Sebelas Indonesia</Text>
        <Text style={styles.subtitle}>Digital products super app</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Flash Sale</Text>
        <Text style={styles.cardDesc}>Auto-delivery • Instant</Text>
      </View>
      <View style={styles.bottomNav}>
        <Text style={styles.nav}>Home</Text>
        <Text style={styles.nav}>Chat</Text>
        <Text style={styles.nav}>Cart</Text>
        <Text style={styles.nav}>Profile</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F5FA",
  },
  header: {
    backgroundColor: "#0E47A1",
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#DDE7FF",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    padding: 16,
    borderRadius: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  cardDesc: {
    color: "#666666",
  },
  bottomNav: {
    marginTop: "auto",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  nav: {
    color: "#0E47A1",
    fontWeight: "600",
  },
});
