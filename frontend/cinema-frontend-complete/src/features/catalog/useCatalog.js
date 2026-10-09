import { useCallback, useEffect, useState } from 'react';
import { catalogApi } from './catalogApi.js';

export function useCatalog() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCityState] = useState(() => sessionStorage.getItem('cinema.city') || '');
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [error, setError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  const setSelectedCity = useCallback((city) => {
    sessionStorage.setItem('cinema.city', city);
    setSelectedCityState(city);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCities() {
      setLoadingCities(true);
      setError('');
      try {
        const allTheaters = await catalogApi.getCities({ signal: controller.signal });
        const cityNames = [...new Set(allTheaters.map((item) => item.city).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b));
        setCities(cityNames);
        setSelectedCityState((current) => {
          const next = current && cityNames.includes(current) ? current : cityNames[0] || '';
          sessionStorage.setItem('cinema.city', next);
          return next;
        });
      } catch (loadError) {
        if (loadError.name !== 'AbortError') setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoadingCities(false);
      }
    }

    loadCities();
    return () => controller.abort();
  }, [reloadVersion]);

  useEffect(() => {
    if (!selectedCity) return undefined;
    const controller = new AbortController();
    setLoadingCatalog(true);
    setError('');

    Promise.all([
      catalogApi.getMovies(selectedCity, { signal: controller.signal }),
      catalogApi.getTheaters(selectedCity, { signal: controller.signal }),
      catalogApi.getShowtimes(selectedCity, { signal: controller.signal }),
    ])
      .then(([movieData, theaterData, showtimeData]) => {
        if (controller.signal.aborted) return;
        setMovies(movieData);
        setTheaters(theaterData);
        setShowtimes(showtimeData);
      })
      .catch((loadError) => {
        if (loadError.name !== 'AbortError' && !controller.signal.aborted) setError(loadError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCatalog(false);
      });

    return () => controller.abort();
  }, [selectedCity, reloadVersion]);

  const refresh = useCallback(() => setReloadVersion((version) => version + 1), []);

  return {
    cities,
    selectedCity,
    setSelectedCity,
    movies,
    theaters,
    showtimes,
    loading: loadingCities || loadingCatalog,
    loadingCities,
    error,
    refresh,
  };
}
