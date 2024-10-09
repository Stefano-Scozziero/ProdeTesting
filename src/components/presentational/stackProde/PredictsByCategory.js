import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, ImageBackground, Text, TouchableOpacity, Pressable } from 'react-native';
import LoadingSpinner from '../LoadingSpinner';
import EmptyListComponent from '../EmptyListComponent';
import Error from '../Error';
import DatesByCategory from '../DatesByCategory';
import { OrientationContext } from '../../../utils/globals/context';
import colors from '../../../utils/globals/colors';
import ModalAlert from '../modal/ModalAlert';
import { db } from '../../../app/services/firebase/config';
import auth from '@react-native-firebase/auth';
import { useSelector } from 'react-redux';
import ModalSelector from 'react-native-modal-selector';

const PredictsByCategory = ({ navigation }) => {
  const [modalAlert, setModalAlert] = useState(false);
  const categorySelected = useSelector(state => state.category.selectedCategory);
  const [datos, setDatos] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const portrait = useContext(OrientationContext);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState('Primera Division');
  const [selectedTournament, setSelectedTournament] = useState('Apertura');
  const [filteredPartidos, setFilteredPartidos] = useState([]);
  const [pickerDataLoaded, setPickerDataLoaded] = useState(false);
  const [puntos, setPuntos] = useState({ eq1: {}, eq2: {} });
  const user = auth().currentUser;
  const [guardarPronosticos, setGuardarPronosticos] = useState(false);
  const [partidosEditados, setPartidosEditados] = useState({});
  
  const divisionSelectorRef = useRef(null);
  const tournamentSelectorRef = useRef(null);
  const dateSelectorRef = useRef(null);
  
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [tournamentOptions, setTournamentOptions] = useState([]);

  useEffect(() => {
    const onValueChange = db.ref('/datos/fixture').on('value', (snapshot) => {
      if (snapshot.exists() && categorySelected !== null) {
        const data = snapshot.val();
        if (data[categorySelected]) {
          setDatos(data);
        } else {
          setTimeout(() => {
            setIsLoading(false);
          }, 2000);
          setDatos(false);
        }
      } else {
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
        setIsError(true);
      }
    }, (error) => {
      console.error(error);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      setIsError(true);
    });
    return () => {
      db.ref('/datos/fixture').off('value', onValueChange);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };
  },  [categorySelected]);

  const getEquipo = (id) => {
    if (datos && datos?.[categorySelected] && datos?.[categorySelected]?.equipos) {
      return datos?.[categorySelected]?.equipos[id];
    }
    return null;
  };

  const handleSumarPuntos = (equipo, id) => {
    setPartidosEditados(prev => ({ ...prev, [id]: true }));

    const nuevosPuntosEq1 = { ...puntos.eq1 };
    const nuevosPuntosEq2 = { ...puntos.eq2 };
    if (nuevosPuntosEq1[id] === undefined && nuevosPuntosEq2[id] === undefined) {
      nuevosPuntosEq1[id] = 0;
      nuevosPuntosEq2[id] = 0;
    } else {
      if (equipo === 'equipo1') {
        nuevosPuntosEq1[id] = (nuevosPuntosEq1[id] || 0) + 1;
      } else {
        nuevosPuntosEq2[id] = (nuevosPuntosEq2[id] || 0) + 1;
      }
    }
    setPuntos({ eq1: nuevosPuntosEq1, eq2: nuevosPuntosEq2 });
  };

  const handleRestarPuntos = (equipo, id) => {
    setPartidosEditados(prev => ({ ...prev, [id]: true }));

    const nuevosPuntosEq1 = { ...puntos.eq1 };
    const nuevosPuntosEq2 = { ...puntos.eq2 };

    if (!nuevosPuntosEq1[id] && !nuevosPuntosEq2[id]) {
      nuevosPuntosEq1[id] = 0;
      nuevosPuntosEq2[id] = 0;
    }

    if (equipo === 'equipo1') {
      nuevosPuntosEq1[id] = Math.max((nuevosPuntosEq1[id] || 0) - 1, 0);
    } else {
      nuevosPuntosEq2[id] = Math.max((nuevosPuntosEq2[id] || 0) - 1, 0);
    }

    setPuntos({ eq1: nuevosPuntosEq1, eq2: nuevosPuntosEq2 });
  };

  const guardarPronosticosEnDB = async () => {
    if (!categorySelected || !selectedDate || !filteredPartidos) return;

    try {
      const pronosticosRef = db.ref(`/profiles/${user.uid}/predicts/${categorySelected}/${selectedDivision}/${selectedTournament}/Fecha:${selectedDate}`);

      const snapshot = await pronosticosRef.once('value');
      const pronosticosExistentes = snapshot.val() || [];

      const pronosticosArray = filteredPartidos
        .filter(partido => partido !== null && partido !== undefined)
        .reduce((obj, partido) => {
          if (partidosEditados[partido.id]) {
            obj[partido.id] = {
              equipo1: {
                nombre: partido.equipo1.nombre,
                puntos: puntos.eq1.hasOwnProperty(partido.id) ? puntos.eq1[partido.id] : undefined
              },
              equipo2: {
                nombre: partido.equipo2.nombre,
                puntos: puntos.eq2.hasOwnProperty(partido.id) ? puntos.eq2[partido.id] : undefined
              }
            };
          } else {
            const pronosticoExistente = pronosticosExistentes[partido.id];
            if (pronosticoExistente) {
              obj[partido.id] = pronosticoExistente;
            }
          }
          return obj;
        }, {});

      await pronosticosRef.set(pronosticosArray);

      setGuardarPronosticos(false);
      setModalAlert(true);

    } catch (error) {
      console.error('Error al guardar los pronósticos:', error);
    }
  };

  useEffect(() => {
    setPuntos({ eq1: {}, eq2: {} });
    const pronosticosRef = db.ref(`/profiles/${user.uid}/predicts/${categorySelected}/${selectedDivision}/${selectedTournament}/Fecha:${selectedDate}`);

    const onValueChange = pronosticosRef.on('value', (snapshot) => {
      const pronosticosObj = snapshot.val();
      if (pronosticosObj) {
        const nuevosPuntosEq1 = {};
        const nuevosPuntosEq2 = {};

        Object.keys(pronosticosObj).forEach(id => {
          const pronostico = pronosticosObj[id];
          nuevosPuntosEq1[id] = pronostico.equipo1.puntos || 0;
          nuevosPuntosEq2[id] = pronostico.equipo2.puntos || 0;
        });

        setPuntos({ eq1: nuevosPuntosEq1, eq2: nuevosPuntosEq2 });
        setGuardarPronosticos(false);
      }
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      setGuardarPronosticos(false);
    }, (error) => {
      console.error('Error al cargar los pronósticos desde la base de datos:', error);
      setIsLoading(false);
    });

    return () => pronosticosRef.off('value', onValueChange);
  }, [categorySelected, selectedDate, selectedDivision, selectedTournament]);

  useEffect(() => {
    const puntosEq1Definidos = Object.values(puntos.eq1).length > 0;
    const puntosEq2Definidos = Object.values(puntos.eq2).length > 0;

    if (puntosEq1Definidos || puntosEq2Definidos) {
      setGuardarPronosticos(true);
    } else {
      setGuardarPronosticos(false);
    }
  }, [puntos]);

  useEffect(() => {
    if (datos && categorySelected) {
      const divisions = Object.keys(datos?.[categorySelected]?.partidos || {})
        .map(key => ({ key, label: key }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setDivisionOptions(divisions);
      setSelectedDivision(divisions.length > 0 ? divisions[0].key : null);
    }
  }, [datos, categorySelected]);

  const dateOptions = categorySelected && datos?.[categorySelected]?.partidos?.[selectedDivision]?.[selectedTournament]
    ? Object.keys(datos?.[categorySelected].partidos?.[selectedDivision]?.[selectedTournament])
        .filter(key => !isNaN(key) && Number(key) >= 1)
        .map(key => ({ key, label: `Fecha ${key}` }))
    : [];

  useEffect(() => {
    if (datos && categorySelected && selectedDivision) {
      const tournaments = Object.keys(datos?.[categorySelected]?.partidos?.[selectedDivision] || {})
        .map(key => ({ key, label: key }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setTournamentOptions(tournaments);
      setSelectedTournament(tournaments.length > 0 ? tournaments[0].key : null);
    }
  }, [datos, categorySelected, selectedDivision]);

  useEffect(() => {
    if (!pickerDataLoaded && datos && categorySelected) {
      const partidosDelTorneo = datos?.[categorySelected]?.partidos?.[selectedDivision]?.[selectedTournament] || [];
      const fechasDisponibles = Object.keys(partidosDelTorneo).filter(key => !isNaN(key)).map(Number);
      const fechasMostradas = fechasDisponibles.filter(fecha => fecha >= 1);
      const primeraFechaDisponibleNoJugada = fechasMostradas.find(fecha => partidosDelTorneo[fecha] && !partidosDelTorneo[fecha].hasPlayed);
      setSelectedDate(primeraFechaDisponibleNoJugada || fechasMostradas[0]);
      setPickerDataLoaded(true);
    }
  }, [categorySelected, datos, pickerDataLoaded, selectedDivision, selectedTournament]);

  useEffect(() => {
    if (selectedDate !== null && datos && categorySelected) {
      const partidosDelTorneo = datos?.[categorySelected]?.partidos?.[selectedDivision]?.[selectedTournament] || {};
      const encuentrosDeLaFecha = partidosDelTorneo?.[selectedDate]?.encuentros || [];
      const partidosConEquipos = encuentrosDeLaFecha.map(partido => ({
        ...partido,
        equipo1: getEquipo(partido.equipo1),
        equipo2: getEquipo(partido.equipo2),
      }));
      setFilteredPartidos(partidosConEquipos);
    }
  }, [selectedDate, datos, categorySelected, selectedDivision, selectedTournament]);

  if (isLoading) return <LoadingSpinner message={'Cargando Datos...'} />;
  if (isError) return <Error message="¡Ups! Algo salió mal." textButton="Recargar" onRetry={() => navigation.navigate('Competencies')} />;
  if (!datos || Object.keys(datos).length === 0) return <EmptyListComponent message="No hay datos disponibles" />;

  return (
    <ImageBackground source={require('../../../../assets/fondodefinitivo.png')} style={[styles.container, !portrait && styles.landScape]}>
      {modalAlert && (
        <ModalAlert
          text="¡Pronósticos guardados exitosamente!"
          duration={2000}
          onClose={() => setModalAlert(false)}
        />
      )}
      <View style={styles.containerPicker}>
        <ModalSelector
          data={divisionOptions}
          initValue={selectedDivision}
          onChange={(option) => setSelectedDivision(option.key)}
          style={styles.picker}
          optionTextStyle={styles.pickerText}
          selectedItemTextStyle={styles.selectedItem}
          initValueTextStyle={styles.initValueTextStyle}
          animationType='fade'
          cancelText='Salir'
          cancelTextStyle={{ color: colors.black }}
          ref={divisionSelectorRef}
          accessible={true}
          touchableAccessible={true}
        >
          <TouchableOpacity style={styles.touchableContainer}>
            <Text style={styles.selectedItemText}>{selectedDivision}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </ModalSelector>

        
        <ModalSelector
          data={tournamentOptions}
          initValue={selectedTournament}
          onChange={(option) => setSelectedTournament(option.key)}
          style={styles.picker}
          optionTextStyle={styles.pickerText}
          selectedItemTextStyle={styles.selectedItem}
          initValueTextStyle={styles.initValueTextStyle}
          animationType='fade'
          cancelText='Salir'
          cancelTextStyle={{ color: colors.black }}
          ref={tournamentSelectorRef}
          accessible={true}
          touchableAccessible={true}
        >
          <TouchableOpacity style={styles.touchableContainer}>
            <Text style={styles.selectedItemText}>{selectedTournament}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </ModalSelector>

       
        <ModalSelector
          data={dateOptions}
          initValue={dateOptions.length > 0 ? `Fecha ${selectedDate}` : 'Selecciona una Fecha'}
          onChange={(option) => setSelectedDate(option.key)}
          style={dateOptions.length === 0 ? styles.disabledPicker : styles.picker}
          optionTextStyle={styles.pickerText}
          selectedItemTextStyle={styles.selectedItem}
          initValueTextStyle={styles.initValueTextStyle}
          animationType='fade'
          cancelText='Salir'
          cancelTextStyle={{ color: colors.black }}
          disabled={dateOptions.length === 0}
          ref={dateSelectorRef}
          accessible={true}
          touchableAccessible={true}
        >
          <TouchableOpacity style={styles.touchableContainer} disabled={dateOptions.length === 0}>
            <Text style={styles.selectedItemText}>
              {dateOptions.length > 0 ? `Fecha ${selectedDate}` : 'Sin Fechas Disponibles'}
            </Text>
            {dateOptions.length !== 0 && <Text style={styles.pickerArrow}>▼</Text>}
          </TouchableOpacity>
        </ModalSelector>
      </View>

      <View style={styles.containerFlatlist}>
        <FlatList
          data={filteredPartidos}
          keyExtractor={(_, index) => `partidos-${index}`}
          renderItem={({ item }) => (
            <DatesByCategory
              encuentros={item}
              onSumarPuntos={(equipo) => handleSumarPuntos(equipo, item.id)}
              onRestarPuntos={(equipo) => handleRestarPuntos(equipo, item.id)}
              puntosEq1={puntos.eq1.hasOwnProperty(item.id) ? puntos.eq1[item.id] : undefined}
              puntosEq2={puntos.eq2.hasOwnProperty(item.id) ? puntos.eq2[item.id] : undefined}
            />
          )}
          ListEmptyComponent={<Text style={{ fontSize: 20 }}>No hay encuentros disponibles</Text>}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={8}
        />
      </View>

      {guardarPronosticos && Object.keys(partidosEditados).length > 0 && 
        <TouchableOpacity activeOpacity={0.8} style={styles.guardarButton} onPress={guardarPronosticosEnDB}>
          <Text style={styles.guardarButtonText}>Guardar Pronósticos</Text>
        </TouchableOpacity>
      }
    </ImageBackground>
  );
}

export default PredictsByCategory;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerPicker: {
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  landScape: {
    width: '100%',
    height: '60%',
  },
  touchableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderColor: colors.orange,
    borderWidth: 1,
  },
  picker: {
    width: '100%',
    borderRadius: 10,
    marginVertical: 5,
  },
  pickerText: {
    color: colors.black,
    textAlign: 'left',
  },
  selectedItemText: {
    color: colors.black,
    fontSize: 16,
  },
  selectedItem: {
    color: colors.orange,
  },
  initValueTextStyle: {
    color: colors.black,
    fontSize: 16,
  },
  pickerArrow: {
    color: colors.black,
    fontSize: 15, 
  },
  containerFlatlist: {
    flex: 1, // Use flex to fill the remaining space
    width: '100%', // Ensure flat list takes full width
    justifyContent: 'center',
    alignItems: 'center',
  },
  guardarButton: {
    position: 'absolute',
    width: '90%',
    bottom: 20,
    backgroundColor: colors.green,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  guardarButtonText: {
    textAlign: 'center',
    color: colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledPicker: {
    backgroundColor: 'rgba(0,0,0,0.1)', 
    borderWidth: 1,
    borderColor: colors.gray,
  },
});
