import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

interface CustomMarkerProps {
  color: string;
  image: any;
}

export const CustomMarker: React.FC<CustomMarkerProps> = ({ color, image }) => {
  return (
    <View style={[styles.markerContainer, { borderColor: color }]}>
      <Image source={{ uri:image }} style={styles.petImage} />
      <View style={[styles.triangle, { borderTopColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    borderWidth: 5,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // Allow triangle positioning
    
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 13,
    borderRightWidth: 13,
    borderTopWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    top: '100%', 
    left: '50%',
    marginLeft: -13, 
  },
});

