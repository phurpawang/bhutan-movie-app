import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const iconSource = require("../assets/app-icon.png");

export type AppLogoProps = {
  size?: number;
  align?: "flex-start" | "center" | "flex-end";
  showText?: boolean;
  tagline?: string;
  tone?: "dark" | "light";
};

/**
 * Brand logo block used across onboarding and home surfaces.
 * Accepts size + alignment props so it can adapt to tight layouts.
 */
export default function AppLogo({
  size = 56,
  align = "flex-start",
  showText = true,
  tagline = "Cinema from Bhutan & beyond",
  tone = "dark",
}: AppLogoProps) {
  const titleColor = tone === "dark" ? "#fff" : "#0f172a";
  const subtitleColor = tone === "dark" ? "#b9c2ff" : "#5f6472";

  return (
    <View
      style={[styles.wrapper, { alignSelf: align }]}
    >
      <Image
        source={iconSource}
        style={{ width: size, height: size, borderRadius: size * 0.32 }}
        resizeMode="cover"
      />
      {showText ? (
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: titleColor }]}>Bhutan Movie App</Text>
          {tagline ? (
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              {tagline}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
    paddingVertical: 4,
  },
  textBlock: {
    flexShrink: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
});
