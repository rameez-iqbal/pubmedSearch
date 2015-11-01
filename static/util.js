var tool = "rameeztest",
	email = "rameez.iqbal@outlook.com";

$(function() {
	$( "#start_date, #end_date" ).datepicker({
		dateFormat: "yy/mm/dd"
		});

	$( "#search" ).click(function() {
		//Display spinning popup
		openModal();

		var terms      = $("#terms").val();
		var start_date = $("#start_date").val();
		var end_date   = $("#end_date").val();

		 $.ajax({
				type: "GET",
				url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed",
				data: {'term':terms,'datetype':'pdat','mindate':start_date,'maxdate':end_date,'retmax':'200','retmode':'json','tool':tool,'email':email},
				dataType: "json",
				success: esearch_response,
				error: function(req, response) {
					closeModal();
					alert("Error:" + response);
				}
			}); // End Ajax

		}); // End search Click
});

// Get list of UIDs from esearch result and pass on to epost
function esearch_response (response) {

	var count      = response.esearchresult.count;
	var id_list    = response.esearchresult.idlist.toString();
	var start_date = $("#start_date").val();
	var end_date   = $("#end_date").val();

	var d = new Date(start_date);
	var start_year = d.getFullYear();

	var d = new Date(end_date);
	var end_year = d.getFullYear();

	 $.ajax({
			type: "POST",
			url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/epost.fcgi?db=pubmed",
			data: {'id':id_list,'tool':tool,'email':email},
			dataType: "xml",
			success: epost_response,
			error: function(req, response) {
				closeModal();
				alert("Error:" + response);
			}
		}); // End Ajax

}

// Using WebEnv and QueryKey, get summary of all publications
function epost_response (xml) {
	var web_env   = $(xml).find("WebEnv").text();
	var query_key = $(xml).find("QueryKey").text();

	$.ajax({
		type: "GET",
		url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed",
		data: {'WebEnv':web_env,'query_key':query_key,'retmode':'json','tool':tool,'email':email},
		dataType: "json",
		success: esummary_response,
		error: function(req, response) {
			closeModal();
			alert("Error:" + response);
		}
	}); // End Ajax
}

// Get pub year, count no of publications in each year
function esummary_response (response) {

	var year_list = [];
	var year_count = [];

	var uids = response.result.uids;

	uids.forEach(function(uid) {
		year = response.result[uid].pubdate.match(/\d{4}/);
		year_list.push(year);
	});

	// count by year
	var count = {};
	for(i in year_list)
	if(count[year_list[i]]) {
		count[year_list[i]]++;
	} else {
	  count[year_list[i]] = 1;
	}
	// create data array
	for(i in count)
		year_count.push({'year': i,'count':count[i]});

	make_chart(year_count);

	//Hide spinning modal
	closeModal();

}

// Draw chart
function make_chart(barData) {

	var bar_chart = d3.select('#bar_chart'),
		WIDTH     = 500,
		HEIGHT    = 500,
		MARGINS   = {
		  top: 20,
		  right: 20,
		  bottom: 20,
		  left: 50
		};

	// Clear any existing chart
	bar_chart.selectAll("*").remove();

	// Create scales for x & y axis. Use container size to calculate range and min/max data to calculate domain
	var xRange = d3.scale.ordinal().rangeRoundBands([MARGINS.left, WIDTH - MARGINS.right], 0.1).domain(barData.map(function (d) {
			return d.year;
		})),
		yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0,
		  d3.max(barData, function (d) {
			return d.count;
		  })
		]),

	// Create x and y axis and append to svg container
	xAxis = d3.svg.axis()
		.scale(xRange)
		.tickSize(5)
		.tickSubdivide(true),

	yAxis = d3.svg.axis()
		.scale(yRange)
		.orient("left")
		.tickSize(5)
		.tickSubdivide(true);

	bar_chart.append('svg:g')
	.attr('class', 'x axis')
	.attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
	.call(xAxis);

	bar_chart.append('svg:g')
	.attr('class', 'y axis')
	.attr('transform', 'translate(' + (MARGINS.left) + ',0)')
	.call(yAxis);

	// Create rect and add to svg
	bar_chart.selectAll('rect')
	.data(barData)
	.enter()
	.append('rect')
	.attr('x', function (d) {
	  return xRange(d.year);
	})
	.attr('y', function (d) {
	  return yRange(d.count);
	})
	.attr('width', xRange.rangeBand())
	.attr('height', function (d) {
	  return ((HEIGHT - MARGINS.bottom) - yRange(d.count));
	})
	.attr('fill', 'grey');
}

// Spinning Modal window functions
function openModal() {
	$("#modal").css("display","block");
	$("#fade").css("display","block");
}

function closeModal() {
	$("#modal").css("display","none");
	$("#fade").css("display","none");
}
