import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';

const StatisticsScreen = () => {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [similarityScore, setSimilarityScore] = useState(null);

  const calculateSimilarity = () => {
    // Jaro Similarity Algorithm
    const jaroSimilarity = (s1, s2) => {
      if (s1 === s2) return 1.0;
      
      const s1Length = s1.length;
      const s2Length = s2.length;
      
      const matchDistance = Math.floor(Math.max(s1Length, s2Length) / 2) - 1;
      
      const s1Matches = new Array(s1Length);
      s1Matches.fill(false);
      const s2Matches = new Array(s2Length);
      s2Matches.fill(false);
      
      let matches = 0;
      let transpositions = 0;
      
      for (let i = 0; i < s1Length; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, s2Length);
        
        for (let j = start; j < end; j++) {
          if (!s2Matches[j] && s1[i] === s2[j]) {
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
          }
        }
      }
      
      if (matches === 0) return 0.0;
      
      let k = 0;
      for (let i = 0; i < s1Length; i++) {
        if (s1Matches[i]) {
          while (!s2Matches[k]) k++;
          if (s1[i] !== s2[k]) transpositions++;
          k++;
        }
      }
      
      const m = matches;
      const t = transpositions / 2;
      const jaroSimilarity = (m / s1Length + m / s2Length + (m - t) / m) / 3;
      
      return jaroSimilarity;
    };

    // Calculate Jaro similarity score
    const score = jaroSimilarity(input1, input2);
    setSimilarityScore(score);
  };
  
  return (
    <View>
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, margin: 10 }}
        onChangeText={text => setInput1(text)}
        value={input1}
        placeholder="Enter first string"
      />
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, margin: 10 }}
        onChangeText={text => setInput2(text)}
        value={input2}
        placeholder="Enter second string"
      />
      <Button
        title="Calculate Similarity"
        onPress={calculateSimilarity}
      />
      {similarityScore !== null &&
        <Text style={{ margin: 10 }}>
          Similarity Score: {similarityScore.toFixed(2)}
        </Text>
      }
    </View>
  );
};

export default StatisticsScreen;
