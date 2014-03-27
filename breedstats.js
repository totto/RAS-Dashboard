var BREEDSTATS = (function(){

  var activeGraph = {};
  var baseUrl = "/dogpopulation/graph/";

  // sContainer: object.sContainer.percentiles
  function graphObject(conf) {
    return {
      title: conf.title,
      url: conf.url,
      statisticsContainer: conf.sContainer || '',
      valueLabel: conf.valueLabel,
      chartType: conf.chartType || 'LineChart',
      data: {},
      divId: function() {
        return this.title.replace(/\s+/g,'');
      },
      detailDivId: function() {
        return this.divId()+'_detail';
      },
      storeData: function(data, year){
        if( this.chartType =='LineChart') {
          this.data[year+''] = data;
          if( data[this.statisticsContainer].n > 0 ) {
            this.dataTable.addRow([
              '' + year,
              data[this.statisticsContainer].mean,
              'Snitt: ' + data[this.statisticsContainer].mean + '\nn: ' + data[this.statisticsContainer].n, // Tooltip for previous data point

              data[this.statisticsContainer].percentile25, // Line graphs for label
              data[this.statisticsContainer].percentile75, // Line graphs for label
              data[this.statisticsContainer].percentile25, // Area 2
              data[this.statisticsContainer].percentile75, // Area 2

              data[this.statisticsContainer].percentile10, // Line graphs for label
              data[this.statisticsContainer].percentile90, // Line
              data[this.statisticsContainer].percentile10, // Area 1
              data[this.statisticsContainer].percentile90 // Area 1

            ]);
            this.dataTable.sort(0);

            this.chart = new google.visualization['LineChart']( document.getElementById(this.divId()) );
            this.chart.draw(this.dataTable, { 
              title: this.title, 
              // curveType: 'function',
              height: 420,
              intervals: { style: 'area' },
              colors: ['#428bca', '#7df', '#7df', '#bef', '#bef'  , '#428bca', '#428bca', '#428bca', '#428bca', '#428bca', '#428bca'],
              legend: {position: 'top', maxLines: 3},
              hAxis: {title: 'År'},
              vAxis: {title: this.valueLabel, minValue:0},
              series: {
                0: {pointSize: 5 }
              }
            });
            
            google.visualization.events.addListener(this.chart, 'select', function(){
              if(activeGraph.chart.getSelection().length > 0 ) {
                var year = activeGraph.dataTable.getFormattedValue( activeGraph.chart.getSelection()[0].row, 0 );
                console.log( 'Show details for year ', year );
                activeGraph.drawDetails(year);
              }
            });
          }
        } else if (this.chartType=='BarChart') {
          if(typeof this.data.length == 'undefined') this.data = [];
          data.countByDiagnose.year = year;
          this.data.push(data.countByDiagnose);
          var dataArray = [];
          var keys = getKeys(this.data);
          
          // Move year to front
          var index = keys.indexOf('year');
          if (index > -1) {
              keys.splice(index, 1);
          }
          keys.sort();
          keys.unshift('year');

          dataArray.push( keys );
          for( var i = 0; i<this.data.length; i++) {
            var entryArray = [];
            for( var j=0; j<keys.length; j++ ) {
              entryArray.push( this.data[i][ keys[j] ] || 0 );
            }
            dataArray.push( entryArray );
          }
          this.dataTable = google.visualization.arrayToDataTable(dataArray, false);
          this.dataTable.sort(0);

          this.chart = new google.visualization['BarChart']( document.getElementById(this.divId()) );
          this.chart.draw(this.dataTable, { 
            title: this.title, 
            height: 420,
            legend: {position: 'top', maxLines: 3},
            orientation: 'horizontal'
          });

        }
      },
      chart: {},
      dataTable: {},
      init: function() {
        if(this.chartType=='LineChart') {
          this.dataTable = new google.visualization.DataTable();
          this.dataTable.addColumn('string', 'År');
          this.dataTable.addColumn('number', 'Snitt');
          this.dataTable.addColumn({type:'string', role:'tooltip'}); // annotation role col.
          this.dataTable.addColumn({type:'number', label:'25 persentil'});
          this.dataTable.addColumn({type:'number', label:'75 persentil'});
          this.dataTable.addColumn({id:'i1', type:'number', role:'interval', label: '25'});
          this.dataTable.addColumn({id:'i1', type:'number', role:'interval', label: '75'});
          this.dataTable.addColumn({type:'number', label:'10 persentil'});
          this.dataTable.addColumn({type:'number', label:'90 persentil'});
          this.dataTable.addColumn({id:'i2', type:'number', role:'interval', label: '10'});
          this.dataTable.addColumn({id:'i2', type:'number', role:'interval', label: '90'});
        } else if(this.chartType =='BarChart') {
          this.data=[];
        }
      },
      drawDetails: function(year) {
        console.log('Draw details:', this.data[year]);

        if( typeof this.data[year].frequency !== 'undefined' ) {
          var data = this.data[year];
          var fr = data.frequency;
          var d = new google.visualization.DataTable();
          d.addColumn('number', 'Innavlsgrad');
          d.addColumn('number', 'Antall hunder');
          for(var i = 0; i < fr.length; i++ ) {
            d.addRow([i, fr[i] ]);
          }
          var detailDiv = document.getElementById(this.detailDivId());
          var chart = new google.visualization['ColumnChart']( detailDiv );
          chart.draw(d, { 
            title: this.title + ' ' + year, 
            height: 420,
            legend: {position: 'top', maxLines: 3}
          });



          $('#detailsContainer').show().appendTo( $('#'+this.divId()) );
          $('#detailsContainer h3').html('Statistikk for ' + year);
          
          $('.nav-tabs li:eq(2) a').tab('show');
          $(detailDiv).appendTo($('#frekvens'));
          $('.nav-tabs a:first').tab('show');

          $('.nav-tabs a[href="#over12"] .badge').html( data.dogsWithCoefficientAbove1250.length );
          $('.nav-tabs a[href="#over25"] .badge').html( data.dogsWithCoefficientAbove2500.length );
          $('.nav-tabs a[href="#over30"] .badge').html( data.dogsWithCoefficientAbove3000.length );
          $('#over12').html( this.getDogList( data.dogsWithCoefficientAbove1250 ) );
          $('#over25').html( this.getDogList( data.dogsWithCoefficientAbove2500 ) );
          $('#over30').html( this.getDogList( data.dogsWithCoefficientAbove3000 ) );

          var tbl = '<table>';
          var details = [
            'Antall hunder i beregning', data.numberOfDogs,
            'Generasjoner', data.generations, 
            'Gjennomsnitt', data.statistics.mean,
            'Min', data.statistics.min,
            'Max', data.statistics.max,
            'Standardavvik', data.statistics.standardDeviation
            ];
          for( var d = 0; d < details.length; d++ ) {
            tbl+='<tr><th>'+details[d]+'</th><td>'+details[++d]+'</td></tr>';
          }
          tbl+='</table>';
          $('#statistikk').html(tbl)

        }
      },
      getDogList: function(dogs) {
        var html = '<ul>';
        for(var i = 0; i<dogs.length; i++) {
          html += '<li><a target="_blank" href="http://dogpopulation.nkk.no/?query='+dogs[i].uuid+'">'+dogs[i].regNo+'</a></li>';
        }
        if(dogs.length < 1 ) {
          html += '<li>Ingen hunder</li>';
        }
        html+='</ul>';
        return html;
      }
    }
  } // graphObject end

  function initiateGraphs(g, $container){
    var html = '';
    for(var i=0;i<g.length;i++){
      html += '<div id="'+g[i].divId()+'" class="col-md-12 graphDiv" data-index="'+i+'"><h3>'+g[i].title+'</h3></div>';
      html += '<div id="'+g[i].detailDivId()+'"></div>';
      g[i].init();
    }
    $container.append(html);
    $('.graphDiv').click(function(){
      var index = $(this).data('index');
      activeGraph = g[index];
    });
  }

  function drawBreedStats(breed, graphtypes, fromYear, toYear, generations){

    console.log('Drawing breed statistics:', breed, generations, fromYear, toYear, graphtypes);

    fromYear = fromYear || 2004;
    toYear = toYear || 2014;
    generations = generations || 6;

    var graphs = [];

    graphtypes = graphtypes.toLowerCase();

    if(graphtypes.indexOf('innavl') > -1) {
      graphs.push( new graphObject({
        title: 'Innavl',
        url:baseUrl+'inbreeding', 
        sContainer:'statistics',
        valueLabel:'Innavlsgrad %'
      }) );
    }

      
    if(graphtypes.indexOf('stamtavle') > -1) {
      graphs.push( new graphObject({
        title:'Stamtavlekompletthet',
        url:baseUrl+'pedigreecompleteness',
        sContainer:'pedigreeCompletenessStatistics', 
        valueLabel:'Kompletthet (%)'
      }) );
    }

    if(graphtypes.indexOf('kullstørrelse') > -1) {
      graphs.push( new graphObject({
        title:'Kullstørrelse',
        url:baseUrl+'litter',
        sContainer:'litterSizeStatistics',
        valueLabel:'Kullstørrelse'
      }) );
    }
      
    if(graphtypes.indexOf('hd') > -1) {
      graphs.push( new graphObject({
        title:'HD-statistikk (fødselsår)',
        url:baseUrl+'hdstatistics/bornyear',
        valueLabel:'HD-statistikk',
        chartType:'BarChart'
      }) );
      graphs.push( new graphObject({
        title:'HD-statistikk (undersøkelsesår)',
        url:baseUrl+'hdstatistics/xrayyear',
        valueLabel:'HD-statistikk',
        chartType:'BarChart'
      }) );
    }

    var activeGraph = graphs[0];

    var containerId = 'lol';

    document.write('<div id="'+containerId+'"></div>')

    initiateGraphs(graphs, $('#'+containerId));

    var data = [
      'breed=' + breed,
      'generations=' + generations,
    ].join('&');
    var minYear = fromYear;
    var maxYear = toYear;

    for(var i=0;i<graphs.length;i++){
      console.log('Getting data for: ', graphs[i].title);
      graphs[i].init();
      for(var year=minYear; year<=maxYear; year++) {
        $.ajax({
          graphIndex: i,
          year: year,
          url: graphs[i].url,
          data: data+'&minYear='+year+'&maxYear='+year
        }).success(function(data){
          graphs[this.graphIndex].storeData(data,this.year);
        });
      }
    }
  };

  function getKeys(docs) {
      var keys = [];
      for ( var i = 0; i < docs.length; i++ ) {
          for( var key in docs[i] ) {
              if( keys.indexOf( key ) < 0 ) {
                  keys.push( key );
              }
          }
      }
      return keys;
  }

  function setBaseUrl(url) {
    baseUrl = url;
  }

  return {
    activeGraph: activeGraph,
    setBaseUrl: setBaseUrl,
    draw: drawBreedStats
  };

}());