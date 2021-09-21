import '../css/style.css';
import './plugins';
import locations from './store/locations';
import formUI from './views/form';
import ticketsUI from './views/tickets';
import currencyUI from './views/currency';

document.addEventListener('DOMContentLoaded', () => {
    const form = formUI.form;
    
    
    // Events
    initApp();
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        onFormSubmit();
    });

    

    // Handlers
    async function initApp() {
        await locations.init();
        formUI.setAutocompleteData(locations.shortCitiesList);
    }

    async function onFormSubmit() {
        // собрать данные из инпутов
        const origin = locations.getCityCodeByKey(formUI.originValue);
        const destination = locations.getCityCodeByKey(formUI.destinationValue);
        const depart_date = formUI.departDateValue;
        const return_date = formUI.returnDateValue;
        const currency = currencyUI.currencyValue;
        // CODE, CODE, 2021-09, 2021-10 - формат данных для отправки на сервер
        await locations.fetchTickets({
            origin,
            destination,
            depart_date,
            return_date,
            currency,
        });


        ticketsUI.renderTickets(locations.lastSearch);

        const addTicketButtons = document.querySelectorAll('.add-favorite');
        
        Object.values(addTicketButtons).forEach( item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                onAddFavoriteClick(item);
            });
        });
        
    }

    function onAddFavoriteClick(item) {
        const id = item.dataset.ticketId;
        locations.addTicketToFavorite(id);
        ticketsUI.renderFavoriteTickets(locations.favorites);
        setEventToDelButtons();
    }    

    function onDeleteFavoriteClick(item) {
        const id = item.dataset.ticketId;
        locations.removeTicketFromFavorite(id);
        ticketsUI.renderFavoriteTickets(locations.favorites);
        setEventToDelButtons();

    }

    function setEventToDelButtons() {
        const removeTicketButtons =  document.querySelectorAll('.delete-favorite');
        Object.values(removeTicketButtons).forEach( item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                onDeleteFavoriteClick(item);
            });
        });
    }
});