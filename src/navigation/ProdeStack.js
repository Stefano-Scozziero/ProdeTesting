// ProdeStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux'; // Importa useSelector
import Home from '../components/presentational/stackProde/Home';
import CustomHeader from '../components/headers/CustomHeader';
import Fixture from '../components/presentational/stackProde/Fixture';
import PredictsByCategory from '../components/presentational/stackProde/PredictsByCategory';
import LeaderBoard from '../components/presentational/stackProde/LeaderBoard';
import News from '../components/presentational/stackProde/News';

const Stack = createNativeStackNavigator();

const ProdeStack = () => {
  // Accede a selectedCategory desde Redux
  const selectedCategory = useSelector(state => state.category.selectedCategory);

  // Define los títulos de las rutas, haciendo que Home sea dinámico
  const routeTitles = {
    Home: selectedCategory || "Inicio",
    Fixture: "Fixture",
    PredictsByCategory: "Mis Predicciones",
    LeaderBoard: "Tabla de Líderes",
    News: "Noticias"
  };

  return (
    <Stack.Navigator
      initialRouteName='Home'
      screenOptions={({ route, navigation }) => {
        const isHome = route.name === 'Home';
        return {
          animationEnabled: false,
          header: () => (
            <CustomHeader 
              title={routeTitles[route.name] || "Detalle"} 
              navigation={navigation}
              showExtraIcon={isHome} // Muestra el icono adicional solo en Home
            />
          ),
        };
      }}
    >
      <Stack.Screen name='Home' component={Home}/>
      <Stack.Screen name="PredictsByCategory" component={PredictsByCategory}/>
      <Stack.Screen name='Fixture' component={Fixture}/>
      <Stack.Screen name='LeaderBoard' component={LeaderBoard}/>
      <Stack.Screen name='News' component={News}/>
    </Stack.Navigator>
  );
};

export default ProdeStack;
