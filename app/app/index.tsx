import { Redirect } from 'expo-router'
import React from 'react'
import { View } from 'react-native'

export default function index() {
  return (
    <View>
      <Redirect href={'/landing'} />
    </View>
  )
}

// import React from "react";
// import {
//   Dimensions,
//   Linking,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// const { width, height } = Dimensions.get("window");

// export default function OnboardingScreen() {
//   return (
//     <View style={styles.container}>
//       <Video
//         source={{ uri: "https://videos.pexels.com/video-files/9431531/9431531-uhd_1440_2560_24fps.mp4" }} // Replace with your own video URL
//         rate={1.0}
//         volume={0.0}
//         isMuted
//         // resizeMode="cover"
//         resizeMode={ResizeMode.COVER}
//         shouldPlay
//         isLooping
//         style={StyleSheet.absoluteFillObject}
//       />

//       <View style={styles.overlay}>
//         <Text style={styles.logo}>aisle</Text>

//         <View style={styles.statsContainer}>
//           <View style={styles.statBox}>
//             <Text style={styles.statValue}>4.5</Text>
//             <Text style={styles.statLabel}>Rating</Text>
//           </View>
//           <View style={styles.statBox}>
//             <Text style={styles.statValue}>20M+</Text>
//             <Text style={styles.statLabel}>Members</Text>
//           </View>
//           <View style={styles.statBox}>
//             <Text style={styles.statValue}>100%</Text>
//             <Text style={styles.statLabel}>Curated Profiles</Text>
//           </View>
//         </View>

//         <Text style={styles.title}>Nothing casual about this dating app</Text>

//         <TouchableOpacity style={styles.button}>
//           <Text style={styles.buttonText}>Get Started</Text>
//         </TouchableOpacity>

//         <Text style={styles.disclaimer}>
//           By signing up, you agree to our{" "}
//           <Text style={styles.link} onPress={() => Linking.openURL("#")}>
//             Terms
//           </Text>
//           . See how we use your data in our{" "}
//           <Text style={styles.link} onPress={() => Linking.openURL("#")}>
//             Privacy Policy
//           </Text>
//           .
//         </Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000",
//   },
//   overlay: {
//     flex: 1,
//     justifyContent: "flex-end",
//     alignItems: "center",
//     paddingBottom: 40,
//     paddingHorizontal: 20,
//   },
//   logo: {
//     fontSize: 42,
//     fontWeight: "bold",
//     color: "#fff",
//     marginBottom: 30,
//     textTransform: "lowercase",
//     fontFamily: "sans-serif-condensed",
//   },
//   statsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     width: "100%",
//     marginBottom: 20,
//   },
//   statBox: {
//     alignItems: "center",
//   },
//   statValue: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#fff",
//   },
//   statLabel: {
//     fontSize: 12,
//     color: "#fff",
//   },
//   title: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "600",
//     textAlign: "center",
//     marginVertical: 15,
//   },
//   button: {
//     backgroundColor: "#b8007e",
//     paddingVertical: 15,
//     paddingHorizontal: 80,
//     borderRadius: 30,
//     marginBottom: 20,
//   },
//   buttonText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 16,
//   },
//   disclaimer: {
//     color: "#ccc",
//     fontSize: 12,
//     textAlign: "center",
//     lineHeight: 18,
//   },
//   link: {
//     textDecorationLine: "underline",
//     color: "#fff",
//   },
// });