import {Component, ViewChild, AfterViewInit, AfterContentChecked} from '@angular/core';
import {MediadataService} from './mediadata.service';
import {FilterPipe} from './filter.pipe';
import {GlobalsService} from './globals.service';
import {Location, LocationStrategy, PathLocationStrategy, APP_BASE_HREF, DatePipe} from '@angular/common';
import { NgForm } from '@angular/forms';
import * as $ from 'jquery';

@Component({
	selector: 'sort-filter-root',
	templateUrl: './app.component.html',
	styleUrls: ['../styles.css'],
	providers: [DatePipe, FilterPipe, Location, {provide: LocationStrategy, useClass: PathLocationStrategy}, {provide: APP_BASE_HREF, useValue: '/'}]
})
export class AppComponent {
	root: string = 'sort-filter-root';
	dataHouse;
	filteredData: any[];
	currentPageData: any[];
	filteredDataLength: number;
	oldFilteredDataLength: number;
	eventTarget: string;

	// Configuration options read from data attributes
	appSrctype: string; // flat, api
	dataPath: string;
	titleField: string;
	imageField: string;
	descriptionField: string;
	dateField: string;
	urlField: string;
	displayFilterVals: boolean;
	displayComments: boolean;
	filterFields: string[];
	imagePosition: string; // top | left | right
	itemsPerPage: string;
	boundaryLinks: boolean;
	directionLinks: boolean;
	bgColor: string;
	formBgColor: string;
	resetButtonColor: string;
	submitButtonColor: string;
	submitButton: boolean;
	clearButton: boolean;
	colWidth: string;
	defaultSort: string;
	defaultFilter: object[];
	filtersAreHierarchical: boolean;
	showItemFilterHerarchy: boolean;
	filterHierarchyDelimiter: string;
	filterIncludeSubs: boolean;
	dateFormat: string;
	makeImagesLinks: boolean;
	altFormats: string;
	additionalFields: string[];
	altLanguages: string;
	hiddenSearch: string;
	hiddenLabels: any;
	fieldLabels: any = [];
	errorMsg: string;

	searchFields: string[];

	// Models
	searchValue: string;
	oldSearchValue: string;
	sortValue: string;
	sortLabel: string;
	defaultSortLabel: string;
	defaultSortValue: string;
	filterModel;

	// Pagination
	currentPage: number = 1;
	maxPages: number;

	// Image and text width, for horizontal layout
	imageColWidth: string;
	textColWidth: string;

	sortOptions: Array<object>;
	location: Location;
	@ViewChild('filtersubmit') filtersubmit: NgForm;
	timer: any = Date.now(); //for registering delay on keystrokes with no submit

	constructor(
		private dataService: MediadataService,
		private globalsService: GlobalsService,
		location: Location) {
			this.location = location;
	}

	ngOnInit() {
		// this.sortOptions = this.globalsService.SORT_OPTIONS;


		// Read data attributes from app-root
		const appInjectDiv = document.getElementsByTagName('sort-filter-root')[0];
		this.appSrctype = appInjectDiv.getAttribute('data-srctype') || 'flat';
		this.dataPath = appInjectDiv.getAttribute('data-datasource');
		this.titleField = appInjectDiv.getAttribute('data-titlefield');
		this.descriptionField = appInjectDiv.getAttribute('data-descfield');
		this.imageField = appInjectDiv.getAttribute('data-imagefield');
		this.dateField = appInjectDiv.getAttribute('data-datefield');
		this.urlField = appInjectDiv.getAttribute('data-urlfield');
		this.displayFilterVals = 'true' === appInjectDiv.getAttribute('data-displayfiltervals');
		this.colWidth = appInjectDiv.getAttribute('data-colwidth');
		if (!this.colWidth) {
			this.colWidth = 'col-12';
		}
		this.imageColWidth = appInjectDiv.getAttribute('data-imagecolwidth');
		if (!this.imageColWidth) {
			this.imageColWidth = 'col-md-4';
		}
		this.textColWidth = appInjectDiv.getAttribute('data-textcolwidth');
		if (!this.textColWidth) {
			this.textColWidth = 'col-md-8';
		}
		this.submitButton = 'true' === appInjectDiv.getAttribute('data-submitbutton');
		this.clearButton = 'true' === appInjectDiv.getAttribute('data-clearbutton');
		this.displayComments = 'true' === appInjectDiv.getAttribute('data-displaycomments');
		this.imagePosition = appInjectDiv.getAttribute('data-imageposition');
		this.itemsPerPage = appInjectDiv.getAttribute('data-itemsperpage');
		this.boundaryLinks = 'true' === appInjectDiv.getAttribute('data-pageboundarylinks');
		this.directionLinks = 'true' === appInjectDiv.getAttribute('data-pagedirectionlinks');
		this.filtersAreHierarchical = 'true' === appInjectDiv.getAttribute('data-filtersarehierarchical');
		this.showItemFilterHerarchy = 'true' === appInjectDiv.getAttribute('data-showitemfilterhierarchy');
		this.filterIncludeSubs = 'true' === appInjectDiv.getAttribute('data-filterincludesubs');
		this.makeImagesLinks = 'true' === appInjectDiv.getAttribute('data-makeimageslinks');
		this.altFormats = appInjectDiv.getAttribute('data-altformats');
		this.altLanguages = appInjectDiv.getAttribute('data-altlanguages');
		this.hiddenSearch = appInjectDiv.getAttribute('data-hiddensearch');
		this.hiddenLabels = appInjectDiv.getAttribute('data-hiddenlabels') ? appInjectDiv.getAttribute('data-hiddenlabels').toLowerCase().split(/\s*,\s*/) : [];
		this.dateFormat = appInjectDiv.getAttribute('data-dateformat');
		if (!this.dateFormat) {
			this.dateFormat = 'mediumDate';
		}
		this.filterHierarchyDelimiter = appInjectDiv.getAttribute('data-filterhierarchydelimiter');
		if (!this.filterHierarchyDelimiter) {
			this.filterHierarchyDelimiter = '>';
		}
		this.bgColor = appInjectDiv.getAttribute('data-bgcolor');
		if (!this.bgColor) {
			this.bgColor = 'bg-white';
		}
		this.formBgColor = appInjectDiv.getAttribute('data-formbgcolor');
		if (!this.formBgColor) {
			this.formBgColor = 'bg-white';
		}
		this.resetButtonColor = appInjectDiv.getAttribute('data-resetbuttoncolor');
		if (!this.resetButtonColor) {
			this.resetButtonColor = 'btn-tertiary';
		}
		this.submitButtonColor = appInjectDiv.getAttribute('data-submitbuttoncolor');
		if (!this.submitButtonColor) {
			this.submitButtonColor = 'btn-primary';
		}
		this.defaultSort = appInjectDiv.getAttribute('data-sortorder');
		if (!this.defaultSort) {
			this.defaultSort = this.titleField + this.globalsService.SORT_VAL_DELIMITER + 'asc';
		}
		this.sortValue = this.defaultSort;
		this.additionalFields = [];
		if ( appInjectDiv.getAttribute('data-additionalfields') ) {
			this.additionalFields = appInjectDiv.getAttribute('data-additionalfields').split(/\s*,\s*/);
		}
		this.filterFields = [];
		this.filterModel = [];
		this.defaultFilter = [];

		this.searchValue = this.getAllQueryStringParams()['Search'] || null;

		// Setup search fields array
		this.searchFields = [];
		this.searchFields.push(this.titleField);
		this.searchFields.push(this.descriptionField);
		this.searchFields.push(this.globalsService.DATE_FORMATTED);

		if(this.hiddenSearch){
			const hiddenFields = this.hiddenSearch.split(',');
			for (let i = 0; i < hiddenFields.length; i++) {
				this.searchFields.push(hiddenFields[i]);
			}
		}

		// Setup width of text column to full if no image present
		if (!this.imageField) {
			this.textColWidth = 'col-12';
		}

		this.dataService.getPosts(this.dataPath).subscribe((response) => {

			const loadingElement = document.getElementById('mediaSpinner');
			const error: any = this.dataService.error;

			//Error scenarios
			if(error && error.status == 404){
				this.errorMsg = "No data are available.";
				console.log(error.status+": The JSON file is missing or cannot be found.");
				loadingElement.parentNode.removeChild(loadingElement);
				return;
			};
			if(!response){
				this.errorMsg = "No data are available.";
				console.log("The JSON file appears to be empty.");
				loadingElement.parentNode.removeChild(loadingElement);
				return;
			};
			if(Object.keys(response).length === 0){
				this.errorMsg = "No data are available.";
				console.log("The JSON file contains an empty object.");
				loadingElement.parentNode.removeChild(loadingElement);
				return;
			};

			this.dataHouse = {};
			this.dataHouse = this.organizeData(response, this.dataHouse);
			this.setDefaultFilters(appInjectDiv.getAttribute('data-defaultfilter'));

			// Initialize default sorting, searching and filtering
			let mockFormVals = [];
			if(this.searchValue){
				mockFormVals['Search'] = this.searchValue;
			}
			if (this.defaultSort) {
				mockFormVals['Sort'] = this.defaultSort;
			}
			if (this.defaultFilter) {
				mockFormVals = Object.assign({}, mockFormVals, this.defaultFilter);
			}
			this.filteredData = new FilterPipe(this.globalsService).transform(this.dataHouse.items,
				mockFormVals, this.searchFields, this.dataHouse.sorts, this.filterIncludeSubs);
			this.filteredDataLength = this.filteredData.length;
			this.oldFilteredDataLength = this.filteredDataLength;


			// Setup filter drop downs based on data file
			for (const key in this.dataHouse.filters) {
				if (Object.prototype.hasOwnProperty.call(this.dataHouse.filters, key)) {
					this.filterFields.push(key);
				}

				if (!this.filterModel.hasOwnProperty(key)) {
					this.filterModel[key] = '';
				}
			}

			// Setup sort drop down based on data file
			this.sortOptions = [];
			for (const sortField in this.dataHouse.sorts) {
				if (Object.prototype.hasOwnProperty.call(this.dataHouse.sorts, sortField)) {
					const ascLabel = this.dataHouse.sorts[sortField]['asc'];
					const sortOptionAsc = [];
					sortOptionAsc['label'] = ascLabel;
					sortOptionAsc['value'] = sortField + this.globalsService.SORT_VAL_DELIMITER + 'asc';
					this.sortOptions.push(sortOptionAsc);

					const descLabel = this.dataHouse.sorts[sortField]['desc'];
					const sortOptionDesc = [];
					sortOptionDesc['label'] = descLabel;
					sortOptionDesc['value'] = sortField + this.globalsService.SORT_VAL_DELIMITER + 'desc';
					this.sortOptions.push(sortOptionDesc);
				}
			}

			//Create Default Sort Label
			for(let i=0; i<this.sortOptions.length; i++){
				if(this.sortOptions[i]['value'] == this.sortValue){
					this.defaultSortLabel = this.sortOptions[i]['label'];
					this.defaultSortValue = this.sortValue;
				}
			}

			this.sortLabel = this.defaultSortLabel;

			// remove spinner
			loadingElement.parentNode.removeChild(loadingElement);
		});
	}

	ngAfterViewInit(){

			let metricsCapture = function(label, interaction) {
				if (window.hasOwnProperty('s')) {
					let s = window['s'];
					if ('function' === typeof s.tl) {
						s.useForcedLinkTracking = false;
						s.prop40 = label + ': ' + interaction;
						s.linkTrackVars = 'prop40,prop49,prop46,prop2,prop31,channel';
						s.tl(true, 'o', label);
					}
				}
				return true;
			};

			window.onclick = (e)=>{
				//window click events capture both keypress and click as click
				if ($(e.target).parent().hasClass('dropdown-menu')) {
					e.preventDefault();
					$(e.target).addClass('selected');
					$(e.target).siblings().removeClass('selected');

					if ($(e.target).parent().hasClass('sort-menu')){ //If a sort menu
						metricsCapture('sort-menu', 'click');
						this.updateFilter(this.filtersubmit.value);
					} else {
						if (!this.submitButton){
							let elementId = $(e.target).parent().parent().attr('id');
							if (elementId) {
								elementId = elementId.replace(' ', '-').toLowerCase().trim();
							}
							metricsCapture(elementId, 'select');
							this.updateFilter(this.filtersubmit.value);
						} else {
							metricsCapture('search-button', 'click');
							$(e.target).parent().prev().html($(e.target).text());
						}

					}
				} else if ($(e.target).hasClass('search-submit') || $(e.target).parent().hasClass('search-submit')) {
					metricsCapture('search-submit-button', 'click');
				} else if ($(e.target).hasClass('form-control-clear')) {
					metricsCapture('search-clear-button', 'click');
				} else if ($(e.target).hasClass('page-link') || $(e.target).parent().hasClass('page-link')) {
					let element = ('span' === $(e.target).prop('tagName').toLowerCase()) ? $(e.target).parent() : $(e.target);
					let ariaLabel = element.attr('aria-label');
					if (ariaLabel && 'previous' === ariaLabel.toLowerCase()) {
						metricsCapture('page-link-previous', 'click');
					} else if(ariaLabel && 'next' === ariaLabel.toLowerCase()) {
						metricsCapture('page-link-next', 'click');
					} else if(ariaLabel && 'first' === ariaLabel.toLowerCase()) {
						metricsCapture('page-link-first', 'click');
					} else if(ariaLabel && 'last' === ariaLabel.toLowerCase()) {
						metricsCapture('page-link-last', 'click');
					} else {
						metricsCapture('page-link-number', 'click');
					}
				} else {
					//console.log(e);
				}
			};
	}

	ngAfterContentChecked(){
		this.filterText();
		$('[aria-label="First"] span').html('First');
		$('[aria-label="Previous"] span').html('Prev');
		$('[aria-label="Next"] span').html('Next');
		$('[aria-label="Last"] span').html('Last');
	}

	selectFilter(e: KeyboardEvent, filter: string, value:any){
		if(e.keyCode === 40 || e.keyCode === 38 || e.keyCode == 9){ //Arrow Down/Up & Tab
			const filterString = filter.toLowerCase().replace(" ", '-');
			if(value.raw){
				$(e.target).focus();
				this.filterModel[filter] = value.raw;
				$('#button-'+filterString).html(value.title);
			} else {
				this.filterModel[filter] = '';
				$('#button-'+filterString).html("Filter by "+filter);
				$(e.target).parent().find('.dropdown-item').first().focus();
				$(e.target).parent().find('.dropdown-item').first().addClass('selected');
			}
		}
	}

	getCommentAnchor() {
		return this.globalsService.COMMENT_ANCHOR;
	}

	organizeData(data, dataHouse) {
		dataHouse.filters = data.filters;
		dataHouse.sorts = data.sort;
		dataHouse.items = data.items;
		dataHouse.filterKeys = [];

		for ( let i = 0; i < dataHouse.items.length; i++ ) {

			// Store formatted date with each item for search
			if ( this.dateField ) {
				let utcDate = dataHouse.items[i][this.dateField];
				let datePipe = new DatePipe('en-US');
				let formattedDate = datePipe.transform( utcDate, this.dateFormat );
				dataHouse.items[i][this.globalsService.DATE_FORMATTED] = formattedDate;
			}

			//Add svg IDs for alt format links
			if ( dataHouse.items[i][this.altFormats] && dataHouse.items[i][this.altFormats].length ) {
				for ( let j = 0; j < dataHouse.items[i][this.altFormats].length; j++ ) {
					let formatLink = dataHouse.items[i][this.altFormats][j]['Alternative File Format'];
					if ( formatLink ) {
						dataHouse.items[i][this.altFormats][j].iconId = this.getIcon(formatLink);
						if ( !dataHouse.items[i][this.altFormats][j]['Link Text (optional)'] ) {
							let name = formatLink.replace(/^.*\//,'');
							let match = formatLink.match(/\.(\w+)$/);
							if ( match && match.length > 1 ) {
								name = match[1].toUpperCase();
							}
							dataHouse.items[i][this.altFormats][j]['Link Text (optional)'] = name;
						}
					}
				}
			}

			// Add svg ID for main link
			dataHouse.items[i].iconId = this.getIcon( dataHouse.items[i][this.urlField] );

			// // Format any additional fieldLabels
			for ( let j = 0; j < this.additionalFields.length; j++ ) {
				let field = this.additionalFields[j];
				if ( !dataHouse.items[i][field] ) {
					continue;
				}
				// Format any date fields
				if ( dataHouse.items[i][field].match(/^20\d{2}[-\/][0,1]\d[-\/][0-3]\d/) ) {
					let utcDate = dataHouse.items[i][this.dateField];
					let datePipe = new DatePipe('en-US');
					dataHouse.items[i][field] = datePipe.transform( utcDate, this.dateFormat );
				}
			}

		};

		// Save filter Keys for easier access and add key to fields to search on
		for (const key in (dataHouse.filters)) {
			if ( dataHouse.filters.hasOwnProperty( key ) ) {
				dataHouse.filterKeys.push(key);
				this.searchFields.push( key );
			}

			//Organize filter values for hierarchy
			let values = dataHouse.filters[key];
			let formattedValues = [];
			for(let i=0; i<values.length; i++){
			   formattedValues.push(this.formatFilterVal(values[i]));
			}
			dataHouse.filters[key] = formattedValues;
		}

		//Set default sorts if none defined in JSON
		for (const key in (dataHouse.sorts)) {
			if (dataHouse.sorts.hasOwnProperty( key )) {
				if(!dataHouse.sorts[key]['asc'].length || !dataHouse.sorts[key]['desc'].length){
					dataHouse.sorts[key] = {asc: key + " Ascending", desc: key + " Descending"};
				}
			}
		}

		return dataHouse;
	}

	filterText(){
		const searchParams = this.getAllQueryStringParams();
		let keys = [];
		for(let key in searchParams) {
			let keyArray = key.split(" ");
			if(keyArray && keyArray.length > 0){
				for(let i=0; i<keyArray.length; i++){
					keyArray[i] = keyArray[i].substring(0,1).toUpperCase() + keyArray[i].substring(1);
				}
				key = keyArray.join(" ");
				keys.push(key);
			}
		};
		if(keys && keys.length > 0 && this.dataHouse){
			for(let i=0; i<keys.length; i++){
				const values = this.dataHouse.filters[keys[i]];
				let returnValue = "Filter by "+keys[i];
				if(values){
					for(let j=0; j<values.length; j++){
						if(values[j].raw == this.filterModel[keys[i]]){
							returnValue = values[j].title;
						}
					}
					const button = $('#button-'+keys[i].toLowerCase().replace(' ','-'));
					if(button){
						$(button).text(returnValue);
					}
				}
			}
		}
	}

	filterClasses(fIndex: number){
		if(!this.submitButton && !this.clearButton){
			if(this.filterFields.length === 1) {return 'one-filter-full col mt-1 mb-1 pl-0';}

			if(fIndex + 1 !== this.filterFields.length){ //If not the last filter
				if(this.filterFields.length % 2){
					return 'col-md-6 mb-3';
				} else {
					return 'col-md-6 mb-3 mb-md-0';
				}
			} else {
				return 'col-md-6';
			}
		} else {
			if(this.filterFields.length === 1){
				return 'one-filter col mt-1 mb-1 pb-0 pl-0';
			} else {
				if(fIndex + 1 !== this.filterFields.length){
					return 'col-md-6 mb-3';
				} else {
					return 'col-md-6 mb-3 mb-md-0';
				}
			}
		}
	}

	getIcon( file ) {
		let iconID = false;
		if ( !file || !file.match ) {
			return iconID;
		}
		let iconIDs = {
			'pdf'   : ['pdf'],
			'ppt'   : ['ppt', 'pptx', 'ppsx'],
			'word'  : ['doc', 'docx'],
			'excel' : ['xls', 'xlsx', 'csv'],
			'media' : ['mp4', 'wmv', 'webm', 'wav', 'ogg', 'wma', 'mov', 'rm', 'mpeg', 'ram', 'ogv', 'avi', 'qt', 'mpg'],
			'txt'   : ['txt', 'rtf'],
			'sas'   : ['sas'],
			'stats' : ['dta', 'sps', 'sav'],
			'image' : ['png', 'jpg', 'jpeg', 'bmp', 'gif'],
			'zip'   : ['zip'],
			'epub'  : ['epub'],
		};
		let match = file.match(/\.(\w+)$/);
		let extension = ( match && match.length ) ? match[1] : file;
		let extensions;
		let id;
		if ( !extension ) {
			return null;
		}
		for ( id in iconIDs ) {
			if ( iconIDs.hasOwnProperty(id) && iconIDs[id].indexOf( extension ) > -1 ) {
				iconID = id;
				break;
			}
		}
		return iconID;
	}

	clearFilter() {
		//Reset Sort & Lists
		this.sortValue = this.defaultSortValue;
		this.sortLabel = this.defaultSortLabel;
		if($(this.root).find('#Sort')){
			$(this.root).find('#Sort').text(this.sortLabel);
		}
		const dropMenus = $(this.root).find('.dropdown-menu');
		for(let i=0; i<dropMenus.length; i++){
			$(dropMenus[i]).find('.dropdown-item.selected').removeClass('selected').promise().then(()=>{
				$(dropMenus[i]).find('.dropdown-item:first-child').addClass('selected');
			});
		}

		// Reset models and form
		$(this.root).find('#Search').focus();
		this.searchValue = null;
		this.oldSearchValue = null;
		for ( const property in this.filterModel ) {
			if ( this.filterModel.hasOwnProperty( property ) ) {
				this.filterModel[property] = '';
				//syntax changed for proper IDs in DOM
				const button = document.getElementById('button-'+property.toLowerCase().replace(" ",'-'));
				if(button){
					button.innerHTML = "Filter by "+property;
				}
			}
		}

		// Reset items in list
		const mockFormVals = [];
		mockFormVals['Sort'] = this.defaultSort;
		this.filteredData = new FilterPipe(this.globalsService).transform(this.dataHouse.items,
			mockFormVals, this.searchFields, this.dataHouse.sorts, this.filterIncludeSubs);
		this.filteredDataLength = this.filteredData.length;

		// Clear query string params
		this.updatePathForFilters( '' );

		// Initial pagination
		this.setupCurrentPage();
	}

	clearSearch(){
		this.searchValue = null;
		const queryArr = this.getAllQueryStringParams();
		delete queryArr['Search'];
		let qs = '';
		for ( const key in queryArr ) {
			if(queryArr[key]){
				let value: any = queryArr[key];
				if(qs === ''){
					qs = '?';
				} else {
					qs += '&';
				}
				qs += key + '=' + encodeURIComponent(value);
			}
		}
		this.updatePathForFilters( qs );
	}

	updateFilter(formVals:any) {
		// this is a pass-through to update the filter pipe on submit
		this.filteredData = new FilterPipe(this.globalsService).transform(this.dataHouse.items,
			formVals, this.searchFields, this.dataHouse.sorts, this.filterIncludeSubs);
		this.filteredDataLength = this.filteredData.length;

		//Sort needs to be independent of current page setup or unfavorable UX, else could be under updatepathforfilters
		if(this.eventTarget){ //only for manual submit
			this.currentPage = 1;
		}
		this.changeCurrentPage(this.currentPage); //currentPage other than 1 for page load only
		let qs = '';
		for ( const key in formVals ) {
			if ( key.startsWith( 'filter-' ) ) {
				const parts = key.split( '-' );
				if ( parts.length > 1 ) {
					if ( formVals[ key ] ) { // If form value is undefined or empty, do not filter on it
						if ( qs === '' ) {
							qs = '?';
						} else {
							qs += '&';
						}
						qs += parts[1] + '=' + encodeURIComponent(formVals[key]);
					}
				}
			} else {
				if(formVals[key]){
					if(qs === ''){
						qs = '?';
					} else {
						qs += '&';
					}
					qs += key + '=' + encodeURIComponent(formVals[key]);
				}
			}
		}
		this.updatePathForFilters( qs );
		if(!$(this.root).find('.dropdown-menu').hasClass('show')){
			this.searchFocus();
		}
	}

	updateSorts(sortValue: any, sortLabel: any){
		this.sortValue = sortValue;
		this.sortLabel = sortLabel;
		this.eventTarget = 'sort';
	}

	searchFocus(){
		if($('#resultCount')){
			$('#resultCount').focus();
		}
	}

	doFilter(filterField, filterValue) {
		const mockFormVals = [];
		this.filterModel[filterField] = filterValue;
		mockFormVals['filter-' + filterField] = filterValue;
		this.filteredData = new FilterPipe(this.globalsService).transform(this.dataHouse.items,
			mockFormVals, this.searchFields, this.dataHouse.sorts, this.filterIncludeSubs);
		this.filteredDataLength = this.filteredData.length;
		this.setupCurrentPage();

		this.updatePathForFilters( '?' + filterField + '=' + filterValue );

		return false; // Needed to stop refresh on click
	}

	updatePathForFilters( qs ) {
		let currentPath = this.location.path();

		// If path contains query string, strip it off
		const queryStringStartIndex = currentPath.indexOf( '?' );
		if ( queryStringStartIndex >= 0 ) {
			currentPath = currentPath.substr( 0, currentPath.indexOf( '?' ) );
		}

		this.location.go( currentPath, qs );
	}

	getAllQueryStringParams(): object[] {
		const uri = window.location.search;
		const queryString = [];
		uri.replace(
			new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
			function($0, $1, $2, $3) {
				const qsKey = decodeURIComponent( $1 );
				const qsVal = decodeURIComponent( $3 );
				queryString[qsKey] = qsVal.replace(/\+/g,' ');
				return '';
			}
		);
		return queryString;
	}

	setupCurrentPage(): void {
		// Trim down dataset to limit to current page
		if(this.filteredData){
			const end = +this.currentPage * +this.itemsPerPage;
			const start = +end - +this.itemsPerPage;
			this.maxPages = Math.ceil(+this.filteredDataLength/+this.itemsPerPage);
			if(start > this.filteredData.length){
				this.currentPage = 1;
				this.currentPageData = this.filteredData;
			} else {
				this.currentPageData = this.filteredData.slice(start, end);
			}
		}
	}

	setDefaultFilters( defaultFilterParam: string ) {
		// First set app defaults
		if ( defaultFilterParam ) {
			const defaultFilterFields = defaultFilterParam.split( ',' );
			for ( let i = 0; i < defaultFilterFields.length; i++ ) {
				const filterFieldAry = defaultFilterFields[i].split( '=' );
				if ( filterFieldAry.length === 2 ) {
					this.defaultFilter['filter-' + filterFieldAry[0]] = filterFieldAry[1];
					this.filterModel[filterFieldAry[0]] = filterFieldAry[1];
				}
			}
		}

		// Now override with query string specifics
		const qs_params = this.getAllQueryStringParams();
		if ( qs_params ) {
			for ( const param in qs_params ) {
				if ( qs_params.hasOwnProperty( param ) ) {
					switch(param) {
						case 'Search':
							this.filtersubmit.value['Search'] = qs_params['Search'];
							this.searchValue = qs_params['Search'];
							break;
						case 'Sort':
							this.defaultSort = qs_params['Sort'];
							this.sortValue = qs_params['Sort'];
							break;
						case 'Page':
							this.currentPage = qs_params['Page'];
							break;
						default:
							this.defaultFilter['filter-' + param] = qs_params[param];
							this.filterModel[param] = qs_params[param];
							this.filtersubmit.value['filter-' + param] = qs_params[param];
					}
				}
			}
			this.updateFilter(this.filtersubmit.value);
			this.changeCurrentPage(this.currentPage);
		}
	}

	changeCurrentPage( pageNumber: number ): void {
		this.currentPage = pageNumber;
		const queryArr = this.getAllQueryStringParams();
		if(pageNumber != 1){
			queryArr['Page'] = pageNumber;
		} else {
			let keys = Object.keys(queryArr);
			if(keys.indexOf('Page') > -1){
				keys.splice(keys.indexOf('Page'), 1);
			}
			delete queryArr['Page'];
		}
		let qs = '';
		for ( const key in queryArr ) {
			if(queryArr[key]){
				let value: any = queryArr[key];
				if(qs === ''){
					qs = '?';
				} else {
					qs += '&';
				}
				qs += key + '=' + encodeURIComponent(value);
			}
		}
		this.updatePathForFilters( qs );
		const scrollTop = $('#sort-filter-desc').offset().top;
		if(queryArr['Page']){
			window.scroll(0,scrollTop);
		}
		this.setupCurrentPage();
	}

	formatForView( val: string ): string {
		if ( val && !this.showItemFilterHerarchy ) {
			const valParts = val.split( this.filterHierarchyDelimiter );
			if ( valParts.length > 0 ) {
				return valParts[ valParts.length - 1 ];
			} else {
				return val;
			}
		} else {
			return val;
		}
	}

	formatFilterVal( val: string ) {
		let value = [];
		if ( val && this.filtersAreHierarchical) {
			const valParts = val.split( this.filterHierarchyDelimiter );
			if ( valParts.length > 0 ) {
				let classEnd = "";
				switch(valParts.length){
					case 1:classEnd = "one"; break;
					case 2:classEnd = "two"; break;
					case 3:classEnd = "three"; break;
					case 4:classEnd = "four"; break;
				}
				value['class'] = "dropdown-node-"+classEnd;
				value['title'] = valParts[ valParts.length - 1 ];
			} else {
				value['class'] = "dropdown-node-one";
				value['title'] = val;
			}
		} else {
			value['class'] = "";
			value['title'] = val;
		}
		value['raw'] = val;
		return value;
	}

	isLabelHidden( label ) {
		return ( typeof label == 'string' ) && this.hiddenLabels.indexOf( label.toLowerCase() ) >= 0;
	}

	// Test if url is external
	isLinkExternal( url ) {
		if ( ! url || typeof url !== 'string' ) {
			return false;
		}
		let isExternal = false;
		const parts = url.match(/\/\/([^\/]+)/);
		const fileExt = url.match( /\.[0-9a-z]+$/ );

		if ( parts && parts.length > 1 ) {
			if ( !parts[1].match(/cdc\.gov$/) ) {
				isExternal = true;
			}
		}

		if ( fileExt && '.pdf' === fileExt[0] ) {
			isExternal = true;
		}
		return isExternal;
	}

}

interface Item {
	cdc_short_title: string;
	month: string;
	year: string;
	cdc_related_image: string;
	public_url: string;
	cdc_session_browsing_categories: object;
	cdc_session_browsing_lifespan: object;
	cdc_internal_description: string;
	cdc_event_start_date: string;
}
