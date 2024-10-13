import { StyleSheet, View, ImageBackground, Text, ScrollView, TouchableOpacity } from 'react-native';
import { OrientationContext } from '../../utils/globals/context';
import { useContext, useState } from 'react';
import colors from '../../utils/globals/colors';

const HowToUseApp = ({ navigation }) => {
  const portrait = useContext(OrientationContext);

  // Estado para controlar qué pasos están expandidos
  const [expandedSteps, setExpandedSteps] = useState({});

  // Datos de ejemplo para los pasos
  const steps = [
    {
      title: 'Realizar Pronóstico:',
      content: 'Desde el menu de inicio en la seccion Predicciones, encontraras las competiciones correspondientes, dandole click los llevara a la pantalla de la competicion y podran comenzar a jugar apostando que equipo ganara, luego cuando ya tengan las predicciones hechas con el boton guardar pronosticos se guardaran los datos.',
    },
    {
      title: 'Fixture:',
      content: 'Desde el menu de inicio y dandole click a fixture, podran ver todas las fechas jugadas para la competicion elegida previamente',
    },
    {
      title: 'Tabla de Lideres:',
      content: 'Desde el menu de inicio y dandole click a tabla de lideres, podran ver las puntuaciones de los equipos para la competencia seleccionada.',
    },
    {
      title: 'Noticias:',
      content: 'Desde el menu de inicio y dandole click a noticias, podran ver los estados de los partidos en tiempo real.',
    },
    {
      title: 'Compartir:',
      content: 'Desde el menu desplegable y dandole click a compartir, podran compartir sus predicciones con sus amigos.',
    },
  ];

  // Función para alternar la expansión de cada paso
  const toggleStep = (index) => {
    setExpandedSteps((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  return (
    <ImageBackground
      source={require('../../../assets/fondodefinitivo.png')}
      style={[styles.main, !portrait && styles.mainLandscape]}
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.content}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <TouchableOpacity onPress={() => toggleStep(index)} style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>{step.title}</Text>
                <Text style={styles.icon}>{expandedSteps[index] ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedSteps[index] && (
                <Text style={styles.text}>{step.content}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default HowToUseApp;

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  mainLandscape: {
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    margin: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fondo semi-transparente
    borderRadius: 10,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  stepContainer: {
    marginBottom: 15,
  },
  subtitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 18,
    color: colors.white,
  },
  text: {
    fontSize: 16,
    color: colors.white,
    lineHeight: 24,
    marginTop: 5,
  },
});
