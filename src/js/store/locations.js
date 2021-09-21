import api from '../services/apiService';
import { formatDate } from '../helpers/date';

class Locations {
    constructor(api, helpers) {
        this.api = api;
        this.countries = null;
        this.cities = null;
        this.airlines = null;
        this.shortCitiesList = null;
        this.favorites = [];
        this.formatDate = helpers.formatDate;
    }

    async init() {
        const response = await Promise.all([
            this.api.countries(),
            this.api.cities(),
            this.api.airlines()
        ]);

        const [countries, cities, airlines] = response;
        this.countries = this.serializeCountries(countries);
        this.cities = this.serializeCities(cities);
        this.airlines = this.serializeAirlines(airlines);
        this.shortCitiesList = this.createShortCitiesList(this.cities);
        return response;
    }

    getCityCodeByKey(key) {
        const city = Object.values(this.cities).find((item) => item.full_name === key);
        return city.code;
    }

    getCityNameByCode(code) {
        return this.cities[code].name;
    }

    createShortCitiesList(cities) {
        // { 'City, Country': null }
        // Object.entries => [key, value]
        return Object.entries(cities).reduce((acc, [, city]) => {
            acc[city.full_name] = null;
            return acc;
        }, {})
    }

    serializeCountries(countries) {
        // { 'Country code': {...} } - функция преобразует полученный массив стран в нужный формат
        return countries.reduce((acc, country) => {
            acc[country.code] = country;
            return acc;
        }, {})
    }
    
    serializeAirlines(airlines) {
        // { 'Airlines code': {...} }
        return airlines.reduce((acc, item) => {
            item.logo = `http://pics.avs.io/200/200/${item.code}.png`;
            item.name = item.name || item.name_translations.en;
            acc[item.code] = item;
            return acc;
        }, {})
    }

    serializeCities(cities) {
        return cities.reduce((acc, city) => {
            const country_name = this.getCountryNameByCityCode(city.country_code);
            city.name = city.name || city.name_translation.en;
            const full_name = `${city.name},${country_name}`;
            acc[city.code] = {
                ...city,
                country_name,
                full_name
            };
            return acc;
        }, {})
    }

    getCountryNameByCityCode(code) {
        return this.countries[code].name;
    }

    addTicketToFavorite(id) {
        if (this.favorites.length && this.favorites.find((item) => item.id === id)) return;
        const ticket = this.lastSearch.find((item) => item.id === id);
        this.favorites.push(ticket);
    };

    removeTicketFromFavorite(id) {
        if (!this.favorites.length) return;

        let index = null;
        const ticket = this.favorites.find((item, ind) => {
            if (item.id === id) {
                index = ind;
                return item;
            }
        });
        this.favorites.splice(index, 1);
    }

    getAirlineNameByCode(code) {
        return this.airlines[code] ? this.airlines[code].name : '';
    }

    getAirlineLogoByCode(code) {
        return this.airlines[code] ? this.airlines[code].logo : '';
    }

    async fetchTickets(params) {
        const response = await this.api.prices(params);
        this.lastSearch = this.serializeTickets(response.data);
    }

    serializeTickets(tickets) {
        return Object.entries(tickets).map(([key, ticket]) => {
            return {
                ...ticket,
                id: key,
                origin_name: this.getCityNameByCode(ticket.origin),
                destination_name: this.getCityNameByCode(ticket.destination),
                airline_logo: this.getAirlineLogoByCode(ticket.airline),
                airline_name: this.getAirlineNameByCode(ticket.airline),
                departure_at: this.formatDate(ticket.departure_at, 'dd MMM yyyy hh:mm'),
                return_at: this.formatDate(ticket.return_at, 'dd MMM yyyy hh:mm'),
            }
        })
    }
}

const locations = new Locations(api, { formatDate });

export default locations;

// { 'City, Country': null } в таком виде принимает значения плагин Materialize Autocomplite
// [{}, {}] в таком виде получаем данные с сервера - массив городов и стран
// { 'City': {...} } => cities[code] - для удобства нам нужен объект городов