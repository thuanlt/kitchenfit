/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 85.71428571428571, "KoPercent": 14.285714285714286};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0002"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0013"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0014"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0003"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0011"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0001"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0012"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0010"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0008"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0009"], "isController": false}, {"data": [0.0, 500, 1500, "01 Agent Discovery"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0006"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0007"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0004"], "isController": false}, {"data": [0.0, 500, 1500, "UI Chat DuongNT214@fpt.com #0005"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 28, 4, 14.285714285714286, 4379.107142857143, 2345, 7644, 4028.0, 6760.4, 7260.149999999998, 7644.0, 2.612183972385484, 2.8601738151879843, 0.0], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["UI Chat DuongNT214@fpt.com #0002", 1, 1, 100.0, 5000.0, 5000, 5000, 5000.0, 5000.0, 5000.0, 5000.0, 0.2, 0.43828125, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0013", 1, 0, 0.0, 6255.0, 6255, 6255, 6255.0, 6255.0, 6255.0, 6255.0, 0.1598721023181455, 0.31209407474020784, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0014", 1, 0, 0.0, 6018.0, 6018, 6018, 6018.0, 6018.0, 6018.0, 6018.0, 0.16616816218012628, 0.34580503281821207, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0003", 1, 0, 0.0, 6266.0, 6266, 6266, 6266.0, 6266.0, 6266.0, 6266.0, 0.15959144589849986, 0.3321185265719757, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0011", 1, 1, 100.0, 5013.0, 5013, 5013, 5013.0, 5013.0, 5013.0, 5013.0, 0.19948134849391583, 0.4371446738479952, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0001", 1, 0, 0.0, 6178.0, 6178, 6178, 6178.0, 6178.0, 6178.0, 6178.0, 0.16186468112657817, 0.3159838843476853, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0012", 1, 0, 0.0, 6212.0, 6212, 6212, 6212.0, 6212.0, 6212.0, 6212.0, 0.16097875080489374, 0.3350055839504186, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0010", 1, 0, 0.0, 6791.0, 6791, 6791, 6791.0, 6791.0, 6791.0, 6791.0, 0.14725371815638344, 0.2874611158150493, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0008", 1, 0, 0.0, 6187.0, 6187, 6187, 6187.0, 6187.0, 6187.0, 6187.0, 0.16162922256343945, 0.31552423428155807, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0009", 1, 0, 0.0, 6372.0, 6372, 6372, 6372.0, 6372.0, 6372.0, 6372.0, 0.15693659761456372, 0.3063635338198368, 0.0], "isController": false}, {"data": ["01 Agent Discovery", 14, 0, 0.0, 2708.2857142857147, 2345, 3056, 2726.5, 3032.0, 3056.0, 3056.0, 4.570682337577538, 0.6472157606921318, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0006", 1, 1, 100.0, 5006.0, 5006, 5006, 5006.0, 5006.0, 5006.0, 5006.0, 0.1997602876548142, 0.43775594286855773, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0007", 1, 0, 0.0, 6757.0, 6757, 6757, 6757.0, 6757.0, 6757.0, 6757.0, 0.1479946721918011, 0.28890756807754925, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0004", 1, 1, 100.0, 5000.0, 5000, 5000, 5000.0, 5000.0, 5000.0, 5000.0, 0.2, 0.43828125, 0.0], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0005", 1, 0, 0.0, 7644.0, 7644, 7644, 7644.0, 7644.0, 7644.0, 7644.0, 0.13082155939298798, 0.2556386136185243, 0.0], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["500/failed | user=DuongNT214@fpt.com | agent=default-assistant | completed=0/1 | attempts=1 | reason=chat.send rejected: rate limit exceeded &mdash; please wait", 4, 100.0, 14.285714285714286], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 28, 4, "500/failed | user=DuongNT214@fpt.com | agent=default-assistant | completed=0/1 | attempts=1 | reason=chat.send rejected: rate limit exceeded &mdash; please wait", 4, "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["UI Chat DuongNT214@fpt.com #0002", 1, 1, "500/failed | user=DuongNT214@fpt.com | agent=default-assistant | completed=0/1 | attempts=1 | reason=chat.send rejected: rate limit exceeded &mdash; please wait", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0011", 1, 1, "500/failed | user=DuongNT214@fpt.com | agent=default-assistant | completed=0/1 | attempts=1 | reason=chat.send rejected: rate limit exceeded &mdash; please wait", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0006", 1, 1, "500/failed | user=DuongNT214@fpt.com | agent=default-assistant | completed=0/1 | attempts=1 | reason=chat.send rejected: rate limit exceeded &mdash; please wait", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["UI Chat DuongNT214@fpt.com #0004", 1, 1, "500/failed | user=DuongNT214@fpt.com | agent=default-assistant | completed=0/1 | attempts=1 | reason=chat.send rejected: rate limit exceeded &mdash; please wait", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
