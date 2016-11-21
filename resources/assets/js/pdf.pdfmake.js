var NINJA = NINJA || {};

NINJA.TEMPLATES = {
  CLEAN: "1",
  BOLD: "2",
  MODERN: "3",
  NORMAL: "4",
  BUSINESS: "5",
  CREATIVE: "6",
  ELEGANT: "7",
  HIPSTER: "8",
  PLAYFUL: "9",
  PHOTO: "10",
  CUSTOM: "11", // ADD WIL
  WAGXW: "12" // ADD WIL
};

var ADDITIONAL_PAGES_COUNT = 2;

function GetPdfMake(invoice, javascript, callback) {
  javascript = NINJA.decodeJavascript(invoice, javascript);

  function jsonCallBack(key, val) {

    // handle custom functions
    if (typeof val === 'string') {
      if (val.indexOf('$firstAndLast') === 0) {
        var parts = val.split(':');
        return function (i, node) {
          return (i === 0 || i === node.table.body.length) ? parseFloat(parts[1]) : 0;
        };
      } else if (val.indexOf('$none') === 0) {
        return function (i, node) {
          return 0;
        };
      } else if (val.indexOf('$notFirstAndLastColumn') === 0) {
        var parts = val.split(':');
        return function (i, node) {
          return (i === 0 || i === node.table.widths.length) ? 0 : parseFloat(parts[1]);
        };
      } else if (val.indexOf('$notFirst') === 0) {
        var parts = val.split(':');
        return function (i, node) {
          return i === 0 ? 0 : parseFloat(parts[1]);
        };
      } else if (val.indexOf('$amount') === 0) {
        var parts = val.split(':');
        return function (i, node) {
          return parseFloat(parts[1]);
        };
      } else if (val.indexOf('$primaryColor') === 0) {
        var parts = val.split(':');
        return NINJA.primaryColor || parts[1];
      } else if (val.indexOf('$secondaryColor') === 0) {
        var parts = val.split(':');
        return NINJA.secondaryColor || parts[1];
      } else if (val.indexOf('$color') === 0) { // ADD WIL
        var parts = val.split(':');
        return parts[1];
      } // FIN ADD WIL
    }

    // determine whether or not to show the header/footer
    if (invoice.features.customize_invoice_design) {
      if (key === 'header') {
        return function (page, pages) {
          if ( page <= (pages - ADDITIONAL_PAGES_COUNT) ) {
            return page === 1 || invoice.account.all_pages_header == '1' ? val : '';
          }
        }
      } else if (key === 'footer') {
        return function (page, pages) {
          if ( page <= (pages - ADDITIONAL_PAGES_COUNT) ) {
            return page === pages || invoice.account.all_pages_footer == '1' ? val : '';
          }
        }
      }
    }

    // check for markdown
    if (key === 'text') {
      val = NINJA.parseMarkdownText(val, true);
    }

    /*
     if (key === 'stack') {
     val = NINJA.parseMarkdownStack(val);
     val = NINJA.parseMarkdownText(val, false);
     }
     */

    return val;
  }

  // Add ninja logo to the footer
  var dd = JSON.parse(javascript, jsonCallBack);
  var designId = invoice.invoice_design_id;
  if (!invoice.features.remove_created_by && !isEdge) {
    var footer = (typeof dd.footer === 'function') ? dd.footer() : dd.footer;
    if (footer) {
      if (footer.hasOwnProperty('columns')) {
        footer.columns.push({image: logoImages.imageLogo1, alignment: 'right', width: 130, margin: [0, 0, 0, 0]})
      } else {
        var foundColumns;
        for (var i = 0; i < footer.length; i++) {
          var item = footer[i];
          if (item.hasOwnProperty('columns')) {
            foundColumns = true;
            var columns = item.columns;
            if (columns[0].hasOwnProperty('stack')) {
              columns[0].stack.push({
                image: logoImages.imageLogo3,
                alignment: 'left',
                width: 130,
                margin: [40, 6, 0, 0]
              });
            } else {
              columns.push({image: logoImages.imageLogo1, alignment: 'right', width: 130, margin: [0, -40, 20, 0]})
            }
          }
        }
        if (!foundColumns) {
          footer.push({image: logoImages.imageLogo1, alignment: 'right', width: 130, margin: [0, 0, 10, 10]})
        }
      }
    }
  }

  // set page size
  dd.pageSize = invoice.account.page_size;

  pdfMake.fonts = {};
  fonts = window.invoiceFonts || invoice.invoice_fonts;

  // Add only the loaded fonts
  $.each(fonts, function (i, font) {
    addFont(font);
  });


  function addFont(font) {
    if (window.ninjaFontVfs[font.folder]) {
      folder = 'fonts/' + font.folder;
      pdfMake.fonts[font.name] = {
        normal: folder + '/' + font.normal,
        italics: folder + '/' + font.italics,
        bold: folder + '/' + font.bold,
        bolditalics: folder + '/' + font.bolditalics
      }
    }
  }

  if (!dd.defaultStyle)dd.defaultStyle = {font: NINJA.bodyFont};
  else if (!dd.defaultStyle.font)dd.defaultStyle.font = NINJA.bodyFont;

  dd.content.push({
    image: CGVimg,
    width: 635,
    height: 770,
    margin: [-60, (dd.pageMargins[1] * (dd.pageMargins[1] < 100 ? 0.75 : 0.95) * -1)],
    pageBreak: 'before'
  });

  dd.content.push({
    image: AFFILIATEimg,
    width: 575,
    height: 770,
    margin: [-30, (dd.pageMargins[1] * (dd.pageMargins[1] < 100 ? 0.75 : 0.95) * -1)],
    pageBreak: 'before'
  });

  doc = pdfMake.createPdf(dd);
  doc.save = function (fileName) {
    this.download(fileName);
  };

  return doc;
}

NINJA.decodeJavascript = function (invoice, javascript) {
  var account = invoice.account;
  var blankImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

  // search/replace variables
  var json = {
    'accountName': account.name || ' ',
    'accountLogo': ( !isEdge && window.accountLogo) ? window.accountLogo : blankImage,
    'accountDetails': NINJA.accountDetails(invoice),
    'accountAddress': NINJA.accountAddress(invoice),
    'invoiceDetails': NINJA.invoiceDetails(invoice),
    'invoiceDetailsHeight': (NINJA.invoiceDetails(invoice).length * 16) + 16,
    'invoiceLineItems': NINJA.invoiceLines(invoice),
    'invoiceLineItemColumns': NINJA.invoiceColumns(invoice),
    'invoiceDocuments': isEdge ? [] : NINJA.invoiceDocuments(invoice),
    'quantityWidth': NINJA.quantityWidth(invoice),
    'taxWidth': NINJA.taxWidth(invoice),
    'clientDetails': NINJA.clientDetails(invoice),
    'notesAndTerms': NINJA.notesAndTerms(invoice),
    'subtotals': NINJA.subtotals(invoice),
    'subtotalsHeight': (NINJA.subtotals(invoice).length * 16) + 16,
    'subtotalsWithoutBalance': NINJA.subtotals(invoice, true),
    'subtotalsBalance': NINJA.subtotalsBalance(invoice),
    'balanceDue': formatMoneyInvoice(invoice.balance_amount, invoice),
    'invoiceFooter': NINJA.invoiceFooter(invoice),
    'invoiceNumber': invoice.invoice_number || ' ',
    'entityType': invoice.is_quote ? invoiceLabels.quote : invoiceLabels.invoice,
    'entityTypeUC': (invoice.is_quote ? invoiceLabels.quote : invoiceLabels.invoice).toUpperCase(),
    'fontSize': NINJA.fontSize,
    'fontSizeLarger': NINJA.fontSize + 1,
    'fontSizeLargest': NINJA.fontSize + 2,
    'fontSizeSmaller': NINJA.fontSize - 1,
    'bodyFont': NINJA.bodyFont,
    'headerFont': NINJA.headerFont,
    // ADD WIL
    'invoiceDetailsCustom': NINJA.invoiceDetailsCustom(invoice),
    'invoiceLineItemsCustom': NINJA.invoiceLinesCustom(invoice),
    'invoiceCopyrightCustom': NINJA.copyrightCustom(invoice),
    'invoiceTotalCustom': NINJA.totalCustom(invoice),
    'invoiceTermsCustom': NINJA.termsCustom(invoice),
    'invoiceNotesCustom': NINJA.notesCustom(invoice),
    'invoicePaymentTermsCustom': NINJA.paymentTermsCustom(invoice),
    'invoiceNeedsAndDelayCustom': NINJA.needsAndDelayCustom(invoice),
    'invoiceSpecificationsCustom': NINJA.specificationsCustom(invoice),
    'invoiceReference': '>invoiceReference',
    'invoiceTitle': '>invoiceTitle',
    'deleted': (invoice.is_deleted ? 'true' : 'false'),
    'clientPaymentTerms': (invoice.client.payment_terms ? invoice.client.payment_terms : 'ø'),
    'quoteID': (invoice.quote_id ? invoice.quote_id : 'ø'),
    'fontSizeSmallest': NINJA.fontSize - 2,
    'diffuseurBalance': '' + invoice.diffuser_balance // ADD
  };

  for (var key in json) {
    // remove trailing commas for these fields
    if (['quantityWidth', 'taxWidth'].indexOf(key) >= 0) {
      var regExp = new RegExp('"\\$' + key + '",', 'g');
      val = json[key];
    } else {
      var regExp = new RegExp('"\\$' + key + '"', 'g');
      var val = JSON.stringify(json[key]);
      val = doubleDollarSign(val);
    }
    javascript = javascript.replace(regExp, val);
  }

  // search/replace labels
  var regExp = new RegExp('"\\$\\\w*?Label(UC)?(:)?(\\\?)?"', 'g');
  var matches = javascript.match(regExp);

  if (matches) {
    for (var i = 0; i < matches.length; i++) {
      var match = matches[i];
      field = match.substring(2, match.indexOf('Label'));
      field = toSnakeCase(field);
      var value = getDescendantProp(invoice, field);
      if (match.indexOf('?') < 0 || value) {
        if (invoice.partial > 0 && field == 'balance_due') {
          field = 'partial_due';
        } else if (invoice.is_quote) {
          if (field == 'due_date') {
            field = 'valid_until';
          } else {
            field = field.replace('invoice', 'quote');
          }
        }
        var label = invoiceLabels[field];
        if (match.indexOf('UC') >= 0) {
          label = label.toUpperCase();
        }
        if (match.indexOf(':') >= 0) {
          label = label + ':';
        }
      } else {
        label = ' ';
      }
      javascript = javascript.replace(match, '"' + label + '"');
    }
  }

  // search/replace values
  var regExp = new RegExp('"\\$[a-z][\\\w\\\.]*?[Value]?"', 'g');
  var matches = javascript.match(regExp);

  if (matches) {
    for (var i = 0; i < matches.length; i++) {
      var match = matches[i];

      // reserved words
      if (['"$none"', '"$firstAndLast"', '"$notFirstAndLastColumn"', '"$notFirst"', '"$amount"', '"$primaryColor"', '"$secondaryColor"', '"$color"'].indexOf(match) >= 0) { // MAJ WIL
        continue;
      }

      // legacy style had 'Value' at the end
      if (endsWith(match, 'Value"')) {
        field = match.substring(2, match.indexOf('Value'));
      } else {
        field = match.substring(2, match.length - 1);
      }
      field = toSnakeCase(field);

      var value = getDescendantProp(invoice, field) || ' ';
      value = doubleDollarSign(value);
      javascript = javascript.replace(match, '"' + value + '"');
    }
  }

  return javascript;
};


NINJA.notesAndTerms = function (invoice) {
  var data = [];

  if (invoice.public_notes) {
    data.push({
      stack: [{
        text: invoice.is_recurring ? processVariables(invoice.public_notes) : invoice.public_notes,
        style: ['notes']
      }]
    });
    data.push({text: ' '});
  }

  if (invoice.terms) {
    data.push({text: invoiceLabels.terms, style: ['termsLabel']});
    data.push({
      stack: [{
        text: invoice.is_recurring ? processVariables(invoice.terms) : invoice.terms,
        style: ['terms']
      }]
    });
  }

  return NINJA.prepareDataList(data, 'notesAndTerms');
};

// ------- ADD WIL 

NINJA.copyrightCustom = function (invoice) {
  var data = [];

  data.push([
    {text: 'Cession de droits d\'auteur', style: ['copyrightHeader', 'copyrightLabel']},
    {text: invoice.copyright_amount ? invoice.copyright_amount : invoiceLabels.copyright_included, style: ['copyrightHeader', 'copyrightValue']}
  ]);

  var copyright_includes = [];

  if (invoice.copyright_included)
    copyright_includes.push(invoiceLabels.sel_exclusivity + " ("+invoice.exclusivity_cf+")");
  else
    copyright_includes.push(invoiceLabels.sel_exclusivity);

  if (invoice.copyright_included)
    copyright_includes.push(invoiceLabels.sel_utilization + " ("+invoice.utilization_cf+")");
  else
    copyright_includes.push(invoiceLabels.sel_utilization);

  if (invoice.copyright_included)
    copyright_includes.push(invoiceLabels.sel_duration + " ("+invoice.duration_cf+")");
  else
    copyright_includes.push(invoiceLabels.sel_duration);

  if (invoice.copyright_included)
    copyright_includes.push(invoiceLabels.sel_scope_visibility + " ("+invoice.scope_visibility_cf+")");
  else
    copyright_includes.push(invoiceLabels.sel_scope_visibility);

  data.push([
    {text: 'Autorisation d\'utilisation et de représentation donnée pour: ' +
    (copyright_includes.length ? copyright_includes.join(', ') : '—'),
      colSpan: 2},
    {text: ' '}
  ]);

  return data;
};

NINJA.specificationsCustom = function (invoice) {
  var data = [];

  if (invoice.invoice_specifications) {
    data.push({
      margin: [0, 5, 0, 5],
      style: ['tableCustom'],
      table: {
        headerRows: 1,
        keepWithHeaderRows: 1,
        dontBreakRows: true,
        widths: ['*'],
        body: [[{
          text: 'Cahier des charges / Brief client',
          style: ['specificationsLabel', 'tableCustomHeader']
        }], [{text: invoice.invoice_specifications}]]
      },
      layout: {
        hLineWidth: '$none',
        vLineWidth: '$none',
        paddingLeft: '$amount:8',
        paddingRight: '$amount:8',
        paddingTop: '$amount:2',
        paddingBottom: '$amount:2'
      }
    });
  }

  return data;
};


NINJA.needsAndDelayCustom = function (invoice) {
  var data = [];

  if (invoice.invoice_needs && invoice.invoice_delays) {
    data.push({
      margin: [0, 5, 0, 5],
      style: ['tableCustom'],
      table: {
        headerRows: 1,
        keepWithHeaderRows: 1,
        dontBreakRows: true,
        widths: ['*'],
        body: [[{
          text: 'Besoins & délais',
          style: ['needsAndDelayLabel', 'tableCustomHeader']
        }], [{text: invoice.invoice_needs}], [{text: invoice.invoice_delays}]]
      },
      layout: {
        hLineWidth: '$none',
        vLineWidth: '$none',
        paddingLeft: '$amount:8',
        paddingRight: '$amount:8',
        paddingTop: '$amount:2',
        paddingBottom: '$amount:2'
      }
    });
  }

  return data;
};


NINJA.notesCustom = function (invoice) {
  var data = [];

  if (invoice.public_notes) {
    //data.push({text:'Commentaires', style: ['notesLabel', 'tableCustomHeader']});
    //data.push({stack:[{text: invoice.is_recurring ? processVariables(invoice.public_notes) : invoice.public_notes, style: ['notes']}]});
    data.push({
      margin: [0, 5, 0, 5],
      style: ['tableCustom'],
      table: {
        headerRows: 1,
        keepWithHeaderRows: 1,
        dontBreakRows: true,
        widths: ['*'],
        body: [[{
          text: 'Commentaires',
          style: ['notesLabel', 'tableCustomHeader']
        }], [{text: invoice.is_recurring ? processVariables(invoice.public_notes) : invoice.public_notes}]]
      },
      layout: {
        hLineWidth: '$none',
        vLineWidth: '$none',
        paddingLeft: '$amount:8',
        paddingRight: '$amount:8',
        paddingTop: '$amount:2',
        paddingBottom: '$amount:2'
      }
    });
  }

  return data;
};

NINJA.totalCustom = function (invoice) {
  var data = [];

  //if (invoice.terms) {
  //data.push({text:invoiceLabels.terms, style: ['termsLabel']});
  data.push([
    {text: 'LABEL MONTANT', style: ['totalLabel', 'tableTotalHeader']},
    {text: '000,00€', style: ['totalAmount', 'tableTotalHeader']}
  ]);
  //}

  return data;
};

NINJA.termsCustom = function (invoice) {
  var data = [];

  if (invoice.terms) {
    //data.push({text:invoiceLabels.terms, style: ['termsLabel']});
    data.push([
      {text: invoice.is_recurring ? processVariables(invoice.terms) : invoice.terms, style: ['terms'], colSpan: 2},
      {text: ' '}
    ]);
  }

  return data;
};

NINJA.paymentTermsCustom = function (invoice) {
  var data = [];

  if (invoice.client.payment_terms) {
    //data.push({text:invoiceLabels.terms, style: ['paymentTermsLabel', 'tableCustomHeader']});
    //data.push({text: invoice.is_recurring ? processVariables(invoice.client.payment_terms) : invoice.client.payment_terms, style: ['paymentTerms']});
    data.push({
      margin: [0, 5, 0, 5],
      style: ['tableCustom'],
      table: {
        headerRows: 1,
        keepWithHeaderRows: 1,
        dontBreakRows: true,
        widths: ['*'],
        body: [[{
          text: invoiceLabels.terms,
          style: ['paymentTermsLabel', 'tableCustomHeader']
        }], [{text: 'Réglement Net ' + ( invoice.is_recurring ? processVariables(invoice.client.payment_terms) : invoice.client.payment_terms ) + ' à réception de la facture'}]]
      },
      layout: {
        hLineWidth: '$none',
        vLineWidth: '$none',
        paddingLeft: '$amount:8',
        paddingRight: '$amount:8',
        paddingTop: '$amount:2',
        paddingBottom: '$amount:2'
      }
    });
  }

  return data;
};
// -------  FIN ADD WIL 

NINJA.invoiceColumns = function (invoice) {
  var account = invoice.account;
  var columns = [];

  if (invoice.has_product_key) {
    columns.push("15%");
  }

  columns.push("*");

  if (invoice.features.invoice_settings && account.custom_invoice_item_label1) {
    columns.push("10%");
  }
  if (invoice.features.invoice_settings && account.custom_invoice_item_label2) {
    columns.push("10%");
  }

  var count = 3;
  if (account.hide_quantity == '1') {
    count -= 2;
  }
  if (account.show_item_taxes == '1') {
    count++;
  }
  for (var i = 0; i < count; i++) {
    columns.push("14%");
  }

  return columns;
};

NINJA.invoiceFooter = function (invoice) {
  var footer = invoice.invoice_footer;

  if (invoice.is_recurring) {
    footer = processVariables(footer);
  }

  if (!invoice.features.invoice_settings && invoice.invoice_design_id == 3) {
    return footer ? footer.substring(0, 200) : ' ';
  } else {
    return footer || ' ';
  }
};

NINJA.quantityWidth = function (invoice) {
  return invoice.account.hide_quantity == '1' ? '' : '"14%", ';
};

NINJA.taxWidth = function (invoice) {
  return invoice.account.show_item_taxes == '1' ? '"14%", ' : '';
};

NINJA.invoiceLines = function (invoice) {
  var account = invoice.account;
  var total = 0;
  var shownItem = false;
  var hideQuantity = invoice.account.hide_quantity == '1';
  var showItemTaxes = invoice.account.show_item_taxes == '1';

  var grid = [[]];

  if (invoice.has_product_key) {
    grid[0].push({text: invoiceLabels.item, style: ['tableHeader', 'itemTableHeader']});
  }

  grid[0].push({text: invoiceLabels.description, style: ['tableHeader', 'descriptionTableHeader']});

  if (invoice.features.invoice_settings && account.custom_invoice_item_label1) {
    grid[0].push({text: account.custom_invoice_item_label1, style: ['tableHeader', 'custom1TableHeader']});
  }
  if (invoice.features.invoice_settings && account.custom_invoice_item_label2) {
    grid[0].push({text: account.custom_invoice_item_label2, style: ['tableHeader', 'custom2TableHeader']});
  }

  if (!hideQuantity) {
    grid[0].push({text: invoiceLabels.unit_cost, style: ['tableHeader', 'costTableHeader']});
    grid[0].push({text: invoiceLabels.quantity, style: ['tableHeader', 'qtyTableHeader']});
  }
  if (showItemTaxes) {
    grid[0].push({text: invoiceLabels.tax, style: ['tableHeader', 'taxTableHeader']});
  }

  grid[0].push({text: invoiceLabels.line_total, style: ['tableHeader', 'lineTotalTableHeader']});

  for (var i = 0; i < invoice.invoice_items.length; i++) {

    var row = [];
    var item = invoice.invoice_items[i];
    var cost = formatMoneyInvoice(item.cost, invoice, true);
    var qty = NINJA.parseFloat(item.qty) ? roundToTwo(NINJA.parseFloat(item.qty)) + '' : '';
    var notes = item.notes;
    var productKey = item.product_key;
    var tax1 = '';
    var tax2 = '';
    var custom_value1 = item.custom_value1;
    var custom_value2 = item.custom_value2;

    if (showItemTaxes) {
      if (item.tax_name1) {
        tax1 = parseFloat(item.tax_rate1);
      }
      if (item.tax_name2) {
        tax2 = parseFloat(item.tax_rate2);
      }
    }

    // show at most one blank line
    if (shownItem && !notes && !productKey && (!cost || cost == '0' || cost == '0.00' || cost == '0,00')) {
      continue;
    }

    shownItem = true;

    // process date variables
    if (invoice.is_recurring) {
      notes = processVariables(notes);
      productKey = processVariables(productKey);
      custom_value1 = processVariables(item.custom_value1);
      custom_value2 = processVariables(item.custom_value2);
    }

    var lineTotal = roundToTwo(NINJA.parseFloat(item.cost)) * roundToTwo(NINJA.parseFloat(item.qty));
    if (account.include_item_taxes_inline == '1') {
      if (tax1) {
        lineTotal += lineTotal * tax1 / 100;
        lineTotal = roundToTwo(lineTotal);
      }
      if (tax2) {
        lineTotal += lineTotal * tax2 / 100;
        lineTotal = roundToTwo(lineTotal);
      }
    }
    lineTotal = formatMoneyInvoice(lineTotal, invoice);

    rowStyle = (i % 2 == 0) ? 'odd' : 'even';

    if (invoice.has_product_key) {
      row.push({style: ["productKey", rowStyle], text: productKey || ' '}); // product key can be blank when selecting from a datalist
    }
    row.push({style: ["notes", rowStyle], stack: [{text: notes || ' '}]});
    if (invoice.features.invoice_settings && account.custom_invoice_item_label1) {
      row.push({style: ["customValue1", rowStyle], text: custom_value1 || ' '});
    }
    if (invoice.features.invoice_settings && account.custom_invoice_item_label2) {
      row.push({style: ["customValue2", rowStyle], text: custom_value2 || ' '});
    }
    if (!hideQuantity) {
      row.push({style: ["cost", rowStyle], text: cost});
      row.push({style: ["quantity", rowStyle], text: qty || ' '});
    }
    if (showItemTaxes) {
      var str = ' ';
      if (item.tax_name1) {
        str += tax1.toString() + '%';
      }
      if (item.tax_name2) {
        if (item.tax_name1) {
          str += '  ';
        }
        str += tax2.toString() + '%';
      }
      row.push({style: ["tax", rowStyle], text: str});
    }
    row.push({style: ["lineTotal", rowStyle], text: lineTotal || ' '});

    grid.push(row);
  }

  return NINJA.prepareDataTable(grid, 'invoiceItems');
};

// ADD WIL
NINJA.invoiceLinesCustom = function (invoice) {
  var account = invoice.account;
  var total = 0;
  var shownItem = false;
  var hideQuantity = invoice.account.hide_quantity == '1';
  var showItemTaxes = invoice.account.show_item_taxes == '1';

  var grid = [[], [], []];
  var colNumber = 0;


  if (invoice.has_product_key) {
    grid[2].push({text: invoiceLabels.item, style: ['tableHeaderLabels', 'itemTableHeader']});
    colNumber++;
  }

  grid[2].push({text: invoiceLabels.description, style: ['tableHeaderLabels', 'descriptionTableHeader']});
  colNumber++;

  if (invoice.features.invoice_settings && account.custom_invoice_item_label1) {
    grid[2].push({text: account.custom_invoice_item_label1, style: ['tableHeaderLabels', 'custom1TableHeader']});
    colNumber++;
  }
  if (invoice.features.invoice_settings && account.custom_invoice_item_label2) {
    grid[2].push({text: account.custom_invoice_item_label2, style: ['tableHeaderLabels', 'custom2TableHeader']});
    colNumber++;
  }

  if (!hideQuantity) {
    grid[2].push({text: invoiceLabels.unit_cost, style: ['tableHeaderLabels', 'costTableHeader']});
    grid[2].push({text: invoiceLabels.quantity, style: ['tableHeaderLabels', 'qtyTableHeader']});
    colNumber++;
  }
  if (showItemTaxes) {
    grid[2].push({text: invoiceLabels.tax, style: ['tableHeaderLabels', 'taxTableHeader']});
    colNumber++;
  }

  grid[2].push({text: invoiceLabels.line_total, style: ['tableHeaderLabels', 'lineTotalTableHeader']});
  colNumber++;

  grid[0].push({
    text: 'Honoraires de conception et réalisation d\'une oeuvre originale',
    style: ['tableHeader', 'typeTableHeader'],
    colSpan: colNumber
  });
  for (var i = 1; i < colNumber; i++) {
    grid[0].push({text: ' '});
  }

  if (!!invoice.title && invoice.title != 'undefined') {
    grid[1].push({text: invoice.title, style: ['tableHeader', 'titleTableHeader'], colSpan: colNumber});
  } else {
    grid[1].push({text: ' '});
  }

  for (var i = 1; i < colNumber; i++) {
    grid[1].push({text: ' '});
  }

  //------

  for (var i = 0; i < invoice.invoice_items.length; i++) {

    var row = [];
    var item = invoice.invoice_items[i];
    var cost = formatMoneyInvoice(item.cost, invoice, true);
    var qty = NINJA.parseFloat(item.qty) ? roundToTwo(NINJA.parseFloat(item.qty)) + '' : '';
    var notes = item.notes;
    var productKey = item.product_key;
    var tax1 = '';
    var tax2 = '';
    var custom_value1 = item.custom_value1;
    var custom_value2 = item.custom_value2;

    if (showItemTaxes) {
      if (item.tax_name1) {
        tax1 = parseFloat(item.tax_rate1);
      }
      if (item.tax_name2) {
        tax2 = parseFloat(item.tax_rate2);
      }
    }

    // show at most one blank line
    if (shownItem && !notes && !productKey && (!cost || cost == '0' || cost == '0.00' || cost == '0,00')) {
      continue;
    }

    shownItem = true;

    // process date variables
    if (invoice.is_recurring) {
      notes = processVariables(notes);
      productKey = processVariables(productKey);
      custom_value1 = processVariables(item.custom_value1);
      custom_value2 = processVariables(item.custom_value2);
    }

    var lineTotal = roundToTwo(NINJA.parseFloat(item.cost)) * roundToTwo(NINJA.parseFloat(item.qty));
    if (account.include_item_taxes_inline == '1') {
      if (tax1) {
        lineTotal += lineTotal * tax1 / 100;
        lineTotal = roundToTwo(lineTotal);
      }
      if (tax2) {
        lineTotal += lineTotal * tax2 / 100;
        lineTotal = roundToTwo(lineTotal);
      }
    }
    lineTotal = formatMoneyInvoice(lineTotal, invoice);

    rowStyle = (i % 2 == 0) ? 'odd' : 'even';

    if (invoice.has_product_key) {
      row.push({style: ["productKey", rowStyle], text: productKey || ' '}); // product key can be blank when selecting from a datalist
    }
    row.push({style: ["notes", rowStyle], stack: [{text: notes || ' '}]});
    if (invoice.features.invoice_settings && account.custom_invoice_item_label1) {
      row.push({style: ["customValue1", rowStyle], text: custom_value1 || ' '});
    }
    if (invoice.features.invoice_settings && account.custom_invoice_item_label2) {
      row.push({style: ["customValue2", rowStyle], text: custom_value2 || ' '});
    }
    if (!hideQuantity) {
      row.push({style: ["cost", rowStyle], text: cost});
      row.push({style: ["quantity", rowStyle], text: qty || ' '});
    }
    if (showItemTaxes) {
      var str = ' ';
      if (item.tax_name1) {
        str += tax1.toString() + '%';
      }
      if (item.tax_name2) {
        if (item.tax_name1) {
          str += '  ';
        }
        str += tax2.toString() + '%';
      }
      row.push({style: ["tax", rowStyle], text: str});
    }
    row.push({style: ["lineTotal", rowStyle], text: lineTotal || ' '});

    grid.push(row);
  }

  return NINJA.prepareDataTable(grid, 'invoiceItems');
};
// END WIL 

NINJA.invoiceDocuments = function (invoice) {
  if (!invoice.account.invoice_embed_documents)return [];
  var stack = [];
  var stackItem = null;

  var j = 0;
  for (var i = 0; i < invoice.documents.length; i++)addDoc(invoice.documents[i]);

  if (invoice.expenses) {
    for (var i = 0; i < invoice.expenses.length; i++) {
      var expense = invoice.expenses[i];
      for (var j = 0; j < expense.documents.length; j++)addDoc(expense.documents[j]);
    }
  }

  function addDoc(document) {
    var path = document.base64;

    if (!path)path = 'docs/' + document.public_id + '/' + document.name;
    if (path && (window.pdfMake.vfs[path] || document.base64)) {
      // Only embed if we actually have an image for it
      if (j % 3 == 0) {
        stackItem = {columns: []};
        stack.push(stackItem);
      }
      stackItem.columns.push({stack: [{image: path, style: 'invoiceDocument', fit: [150, 150]}], width: 175});
      j++;
    }
  }

  return stack.length ? {stack: stack} : [];
};

NINJA.subtotals = function (invoice, hideBalance) {
  if (!invoice) {
    return;
  }

  if (!!invoice.save_deleted) {
    invoice.total_amount *= -1;
    invoice.balance_amount *= -1;
    invoice.subtotal_amount *= -1;
    invoice.partial *= -1;
  }

  var account = invoice.account;
  var data = [];
  data.push([{
    text: invoiceLabels.subtotal,
    style: ['subtotalsLabel', 'subtotalLabel']
  }, {text: formatMoneyInvoice(invoice.subtotal_amount, invoice), style: ['subtotals', 'subtotal']}]);

  if (invoice.discount_amount != 0) {
    data.push([{
      text: invoiceLabels.discount,
      style: ['subtotalsLabel', 'discountLabel']
    }, {text: formatMoneyInvoice(invoice.discount_amount, invoice), style: ['subtotals', 'discount']}]);
  }

  if (NINJA.parseFloat(invoice.custom_value1) && invoice.custom_taxes1 == '1') {
    data.push([{
      text: account.custom_invoice_label1,
      style: ['subtotalsLabel', 'customTax1Label']
    }, {text: formatMoneyInvoice(invoice.custom_value1, invoice), style: ['subtotals', 'customTax1']}]);
  }
  if (NINJA.parseFloat(invoice.custom_value2) && invoice.custom_taxes2 == '1') {
    data.push([{
      text: account.custom_invoice_label2,
      style: ['subtotalsLabel', 'customTax2Label']
    }, {text: formatMoneyInvoice(invoice.custom_value2, invoice), style: ['subtotals', 'customTax2']}]);
  }

  for (var key in invoice.item_taxes) {
    if (invoice.item_taxes.hasOwnProperty(key)) {
      var taxRate = invoice.item_taxes[key];
      var taxStr = taxRate.name + ' ' + (taxRate.rate * 1).toString() + '%';
      data.push([{
        text: taxStr,
        style: ['subtotalsLabel', 'taxLabel']
      }, {text: formatMoneyInvoice(taxRate.amount, invoice), style: ['subtotals', 'tax']}]);
    }
  }

  if (invoice.tax_name1) {
    var taxStr = invoice.tax_name1 + ' ' + (invoice.tax_rate1 * 1).toString() + '%';
    data.push([{
      text: taxStr,
      style: ['subtotalsLabel', 'tax1Label']
    }, {text: formatMoneyInvoice(invoice.tax_amount1, invoice), style: ['subtotals', 'tax1']}]);
  }
  if (invoice.tax_name2) {
    var taxStr = invoice.tax_name2 + ' ' + (invoice.tax_rate2 * 1).toString() + '%';
    data.push([{
      text: taxStr,
      style: ['subtotalsLabel', 'tax2Label']
    }, {text: formatMoneyInvoice(invoice.tax_amount2, invoice), style: ['subtotals', 'tax2']}]);
  }

  if (NINJA.parseFloat(invoice.custom_value1) && invoice.custom_taxes1 != '1') {
    data.push([{
      text: account.custom_invoice_label1,
      style: ['subtotalsLabel', 'custom1Label']
    }, {text: formatMoneyInvoice(invoice.custom_value1, invoice), style: ['subtotals', 'custom1']}]);
  }
  if (NINJA.parseFloat(invoice.custom_value2) && invoice.custom_taxes2 != '1') {
    data.push([{
      text: account.custom_invoice_label2,
      style: ['subtotalsLabel', 'custom2Label']
    }, {text: formatMoneyInvoice(invoice.custom_value2, invoice), style: ['subtotals', 'custom2']}]);
  }

  // ADD WIL TOTAL TTC
  data.push([{
    text: invoiceLabels.total,
    style: ['totalsLabel', 'totalLabel']
  }, {
    text: formatMoneyInvoice((!!invoice.save_deleted) ? invoice.amount * -1 : invoice.amount, invoice),
    style: ['totals', 'total']
  }]);

  var paid = invoice.amount - invoice.balance;
  if (invoice.account.hide_paid_to_date != '1' || paid) {
    data.push([{
      text: invoiceLabels.paid_to_date,
      style: ['subtotalsLabel', 'paidToDateLabel']
    }, {text: formatMoneyInvoice(paid, invoice), style: ['subtotals', 'paidToDate']}]);
  }

  var isPartial = NINJA.parseFloat(invoice.partial);

  if (!hideBalance || isPartial) {
    data.push([
      {text: invoiceLabels.balance_due, style: ['subtotalsLabel', isPartial ? '' : 'balanceDueLabel']},
      {text: formatMoneyInvoice(invoice.total_amount, invoice), style: ['subtotals', isPartial ? '' : 'balanceDue']}
    ]);
  }

  if (!hideBalance) {
    if (isPartial) {
      data.push([
        {text: invoiceLabels.partial_due, style: ['subtotalsLabel', 'balanceDueLabel']},
        {text: formatMoneyInvoice(invoice.balance_amount, invoice), style: ['subtotals', 'balanceDue']}
      ]);
    }
  }

  return NINJA.prepareDataPairs(data, 'subtotals');
};

NINJA.subtotalsBalance = function (invoice) {
  var isPartial = NINJA.parseFloat(invoice.partial);
  return [[
    {
      text: isPartial ? invoiceLabels.partial_due : invoiceLabels.balance_due,
      style: ['subtotalsLabel', 'balanceDueLabel']
    },
    {text: formatMoneyInvoice(invoice.balance_amount, invoice), style: ['subtotals', 'balanceDue']}
  ]];
};

NINJA.accountDetails = function (invoice) {
  var account = invoice.account;
  /*if (invoice.features.invoice_settings && account.invoice_fields) {
   var fields = JSON.parse(account.invoice_fields).account_fields1; // Remove here when added by JustCoded
   } else {*/
  var fields = [
    'account.company_name',
    //'account.id_number',
    //'account.vat_number',
    'account.address1',
    'account.address2',
    'account.city_state_postal',
    'account.country',

    'account.phone',
    'account.fax',
    'account.mobile',

    'account.email',
    'account.website',
  ];
  //}

  var data = [];

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var value = NINJA.renderClientOrAccountField(invoice, field);
    if (value) {
      data.push(value);
    }
  }

  return NINJA.prepareDataList(data, 'accountDetails');
}

NINJA.accountAddress = function (invoice) {
  var account = invoice.account;
  if (invoice.features.invoice_settings && account.invoice_fields) {
    var fields = JSON.parse(account.invoice_fields).account_fields2;
  } else {
    var fields = [
      'account.address1',
      'account.address2',
      'account.city_state_postal',
      'account.country',
      'account.custom_value1',
      'account.custom_value2',
    ]
  }

  var data = [];

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var value = NINJA.renderClientOrAccountField(invoice, field);
    if (value) {
      data.push(value);
    }
  }

  return NINJA.prepareDataList(data, 'accountAddress');
};

NINJA.renderInvoiceField = function (invoice, field) {

  var account = invoice.account;
  if (field == 'invoice.invoice_number') {
    return [
      {
        text: (invoice.is_quote ? invoiceLabels.quote_number : invoiceLabels.invoice_number),
        style: ['invoiceNumberLabel']
      },
      {text: invoice.invoice_number, style: ['invoiceNumber']}
    ];
  } else if (field == 'invoice.credit_note_number') {
    return [
      {text: invoiceLabels.credit_note_number, style: ['invoiceNumberLabel']},
      {text: invoice.credit_note_number, style: ['invoiceNumber']}
    ];
  } else if (field == 'invoice.po_number') {
    return [
      {text: invoiceLabels.po_number},
      {text: invoice.po_number}
    ];
  } else if (field == 'invoice.invoice_date') {
    return [
      {text: (invoice.is_quote ? invoiceLabels.quote_date : invoiceLabels.invoice_date)},
      {text: invoice.invoice_date}
    ];
  } else if (field == 'invoice.due_date') {
    return [
      {text: (invoice.is_quote ? invoiceLabels.valid_until : invoiceLabels.due_date)},
      {text: invoice.is_recurring ? false : invoice.due_date}
    ];
  } else if (field == 'invoice.custom_text_value1') {
    if (invoice.custom_text_value1 && account.custom_invoice_text_label1) {
      return [
        {text: invoice.account.custom_invoice_text_label1},
        {text: invoice.is_recurring ? processVariables(invoice.custom_text_value1) : invoice.custom_text_value1}
      ];
    } else {
      return false;
    }
  } else if (field == 'invoice.custom_text_value2') {
    if (invoice.custom_text_value2 && account.custom_invoice_text_label2) {
      return [
        {text: invoice.account.custom_invoice_text_label2},
        {text: invoice.is_recurring ? processVariables(invoice.custom_text_value2) : invoice.custom_text_value2}
      ];
    } else {
      return false;
    }
  } else if (field == 'invoice.balance_due') {
    return [
      {text: invoiceLabels.balance_due, style: ['invoiceDetailBalanceDueLabel']},
      {text: formatMoneyInvoice(invoice.total_amount, invoice), style: ['invoiceDetailBalanceDue']}
    ];
  } else if (field == invoice.partial_due) {
    if (NINJA.parseFloat(invoice.partial)) {
      return [
        {text: invoiceLabels.partial_due, style: ['invoiceDetailBalanceDueLabel']},
        {text: formatMoneyInvoice(invoice.balance_amount, invoice), style: ['invoiceDetailBalanceDue']}
      ];
    } else {
      return false;
    }
  } else if (field == 'invoice.order_from') {
    return [
      {text: invoiceLabels.order_from},
      {text: invoice.order_from}
    ];
  } else if (field == 'invoice.reference') {
    return [
      {text: invoiceLabels.reference},
      {text: invoice.reference}
    ];
  }
};

// --- ADD WIL 
NINJA.renderInvoiceFieldCustom = function (invoice, field) {

  var account = invoice.account;
  if (field == 'invoice.invoice_number') {
    return [
      {
        text: (invoice.is_quote ? invoiceLabels.quote_number : invoiceLabels.invoice_number),
        style: ['invoiceNumberLabel']
      },
      {text: invoice.invoice_number, style: ['invoiceNumber']}
    ];
  } else if (field == 'invoice.credit_note_number') {
    return [
      {text: invoiceLabels.credit_note_number, style: ['invoiceNumberLabel']},
      {text: invoice.credit_note_number, style: ['invoiceNumber']}
    ];
  } else if (field == 'invoice.blank') {
    return [
      {text: ' ', style: ['tableBlank']},
      {text: ' ', style: ['tableBlank']}
    ];
  } else if (field == 'invoice.po_number') {
    return [
      {text: invoiceLabels.po_number + ' :', style: ['invoicePoNumberLabel']},
      {text: invoice.po_number, style: ['invoicePoNumber']}
    ];
  } else if (field == 'invoice.quote_id') {
    return [
      {text: 'Référence du devis :', style: ['invoiceQuoteIdLabel']},
      {text: '' + invoice.quote_number, style: ['invoiceQuoteId']}
    ];
  } else if (field == 'invoice.invoice_date') {
    return [
      {text: (invoice.is_quote ? invoiceLabels.quote_date : invoiceLabels.invoice_date) + ' :'},
      {text: invoice.invoice_date}
    ];
  } else if (field == 'invoice.due_date') {
    return [
      {text: (invoice.is_quote ? invoiceLabels.valid_until : invoiceLabels.due_date) + ' :'},
      {text: invoice.is_recurring ? false : invoice.due_date}
    ];
  } else if (field == 'invoice.custom_text_value1') {
    if (invoice.custom_text_value1 && account.custom_invoice_text_label1) {
      return [
        {text: invoice.account.custom_invoice_text_label1 + ' :', style: ['invoiceDetailCustomInvoiceText1Label']},
        {
          text: invoice.is_recurring ? processVariables(invoice.custom_text_value1) : invoice.custom_text_value1,
          style: ['invoiceDetailCustomInvoiceText1']
        }
      ];
    } else {
      return false;
    }
  } else if (field == 'invoice.custom_text_value2') {
    if (invoice.custom_text_value2 && account.custom_invoice_text_label2) {
      return [
        {text: invoice.account.custom_invoice_text_label2 + ' :'},
        {text: invoice.is_recurring ? processVariables(invoice.custom_text_value2) : invoice.custom_text_value2}
      ];
    } else {
      return false;
    }
  } else if (field == 'invoice.balance_due') {
    return [
      {text: invoiceLabels.balance_due + ' :', style: ['invoiceDetailBalanceDueLabel']},
      {text: formatMoneyInvoice(invoice.total_amount, invoice), style: ['invoiceDetailBalanceDue']}
    ];
  } else if (field == invoice.partial_due) {
    if (NINJA.parseFloat(invoice.partial)) {
      return [
        {text: invoiceLabels.partial_due + ' :', style: ['invoiceDetailBalanceDueLabel']},
        {text: formatMoneyInvoice(invoice.balance_amount, invoice), style: ['invoiceDetailBalanceDue']}
      ];
    } else {
      return false;
    }
  } else if (field == 'invoice.order_from') {
    return [
      {text: invoiceLabels.order_from},
      {text: invoice.order_from}
    ];
  } else if (field == 'invoice.reference') {
    return [
      {text: invoiceLabels.reference},
      {text: invoice.reference}
    ];
  }
};
// --- END ADD WIL 

NINJA.invoiceDetails = function (invoice) {

  var account = invoice.account;
  if (invoice.features.invoice_settings && account.invoice_fields) {
    var fields = JSON.parse(account.invoice_fields).invoice_fields;
  } else {
    var fields = [
      'invoice.invoice_number',
      'invoice.po_number',
      'invoice.invoice_date',
      'invoice.due_date',
      'invoice.balance_due',
      'invoice.partial_due',
      'invoice.custom_text_value1',
      'invoice.custom_text_value2',
      'invoice.order_from',
      'invoice.reference'
    ];
  }

  if (invoice.save_deleted) {
    fields.splice(0, 0, 'invoice.credit_note_number');
  }

  if (invoice.quote_id) {
    fields.splice(4, 0, 'invoice.quote_id');
  }

  var data = [];

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var value = NINJA.renderInvoiceField(invoice, field);
    if (value) {
      data.push(value);
    }
  }

  return NINJA.prepareDataPairs(data, 'invoiceDetails');
};

// ------ ADD WIL 
NINJA.invoiceDetailsCustom = function (invoice) {

  var account = invoice.account;
  /*if (invoice.features.invoice_settings && account.invoice_fields) {
   var fields = JSON.parse(account.invoice_fields).invoice_fields;
   } else {*/
  var fields = [
    'invoice.invoice_number',
    'invoice.blank', // ADD
    'invoice.custom_text_value1',
    'invoice.custom_text_value2',
    'invoice.po_number',
    'invoice.invoice_date',
    'invoice.due_date',
    'invoice.balance_due',
    'invoice.partial_due',
    'invoice.order_from',
    'invoice.reference'
  ];

  if (invoice.save_deleted) {
    fields.splice(0, 0, 'invoice.credit_note_number');
  }

  if (invoice.quote_id) {
    fields.splice(4, 0, 'invoice.quote_id');
  }
  //}
  var data = [];
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var value = NINJA.renderInvoiceFieldCustom(invoice, field);
    if (value) {
      data.push(value);
    }
  }
  return NINJA.prepareDataPairs(data, 'invoiceDetailsCustom');
};
// END --- ADD WIL 

NINJA.renderClientOrAccountField = function (invoice, field) {
  var client = invoice.client;
  if (!client) {
    return false;
  }
  var account = invoice.account;
  //var contact = client.contacts[0];
  // WIL / FIND THE RIGHT CONTACT IN LIST
  for (var i = 0; i < client.contacts.length; i++) {
    var current_contact = client.contacts[i].send_invoice === true ? i : 0;
  }
  var contact = client.contacts[current_contact];
  // FIN WIL

  if (field == 'client.client_name') {
    var clientName = client.name || (contact.first_name || contact.last_name ? (contact.first_name + ' ' + contact.last_name) : contact.email);
    return {text: clientName || ' ', style: ['clientName']};
  } else if (field == 'client.contact_name') {
    return (contact.first_name || contact.last_name) ? {
      text: 'À l\'attention de ' + contact.first_name + ' ' + contact.last_name,
      style: ['clientContact']
    } : false; // MAJ WIL
  } else if (field == 'client.id_number') {
    return {text: client.id_number};
  } else if (field == 'client.vat_number') {
    return {text: client.vat_number};
  } else if (field == 'client.address1') {
    return {text: client.address1};
  } else if (field == 'client.address2') {
    return {text: client.address2};
  } else if (field == 'client.city_state_postal') {
    var cityStatePostal = '';
    if (client.city || client.state || client.postal_code) {
      var swap = client.country && client.country.swap_postal_code;
      cityStatePostal = formatAddress(client.city, client.state, client.postal_code, swap);
    }
    return {text: cityStatePostal};
  } else if (field == 'client.country') {
    return {text: client.country ? client.country.name : ''};
  } else if (field == 'client.email') {
    var clientEmail = contact.email == clientName ? '' : contact.email;
    return {text: clientEmail};
  } else if (field == 'client.custom_value1') {
    return {text: account.custom_client_label1 && client.custom_value1 ? '***' + account.custom_client_label1 + '*** ' + client.custom_value1 : false}; // MAJ WIL
  } else if (field == 'client.custom_value2') {
    return {text: account.custom_client_label2 && client.custom_value2 ? '***' + account.custom_client_label2 + '*** ' + client.custom_value2 : false}; // MAJ WIL
  } else if (field == 'invoice.last_edit_date') {
    var formattedDate = new Date(invoice.updated_at);
    var d = formattedDate.getDate();
    var m = formattedDate.getMonth();
    m += 1;  // JavaScript months are 0-11

    var months = ["janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

    var M = months[m];

    var y = formattedDate.getFullYear();
    var return_date = d + " " + M + " " + y;
    return {text: 'À ' + client.city + ', le ' + return_date}; // MAJ WIL
  }

  if (field == 'account.company_name') {
    return {text: account.name + ', Wilhem Arnoldy', style: ['accountName']}; // MAJ WIL
  } else if (field == 'account.id_number') {
    return {text: '***SIRET*** ' + account.id_number, style: ['idNumber']}; // MAJ WIL
  } else if (field == 'account.vat_number') {
    return {text: '***TVA*** ' + account.vat_number, style: ['vatNumber']}; // MAJ WIL
  } else if (field == 'account.website') {
    return {text: '***W ***' + account.website, style: ['website']}; // MAJ WIL
  } else if (field == 'account.email') {
    return {text: '***M ***' + account.work_email, style: ['email']}; // MAJ WIL
  } else if (field == 'account.phone') {
    return {text: '***T ***' + account.work_phone, style: ['phone']}; // MAJ WIL
  } else if (field == 'account.mobile') {
    return {text: '***P ***' + account.work_mobile, style: ['mobilephone']}; // MAJ WIL
  } else if (field == 'account.fax') {
    return {text: '***F ***' + account.work_fax, style: ['fax']}; // MAJ WIL
  } else if (field == 'account.address1') {
    return {text: account.address1};
  } else if (field == 'account.address2') {
    return {text: account.address2};
  } else if (field == 'account.city_state_postal') {
    var cityStatePostal = '';
    if (account.city || account.state || account.postal_code) {
      var swap = account.country && account.country.swap_postal_code;
      cityStatePostal = formatAddress(account.city, account.state, account.postal_code, swap);
    }
    return {text: cityStatePostal};
  } else if (field == 'account.country') {
    return account.country ? {text: account.country.name, style: ['country']} : false;
  } else if (field == 'account.custom_value1') {
    if (invoice.features.invoice_settings) {
      return invoice.account.custom_label1 && invoice.account.custom_value1 ? {text: '***' + invoice.account.custom_label1 + '*** ' + invoice.account.custom_value1} : false; // MAJ WIL
    }
  } else if (field == 'account.custom_value2') {
    if (invoice.features.invoice_settings) {
      return invoice.account.custom_label2 && invoice.account.custom_value2 ? {text: '***' + invoice.account.custom_label2 + '*** ' + invoice.account.custom_value2} : false; // MAJ WIL
    }
  }

  return false;
}

NINJA.clientDetails = function (invoice) {
  var account = invoice.account;
  if (invoice.features.invoice_settings && account.invoice_fields) {
    var fields = JSON.parse(account.invoice_fields).client_fields;
  } else {
    var fields = [
      'client.client_name',
      'client.id_number',
      'client.vat_number',
      'client.address1',
      'client.address2',
      'client.city_state_postal',
      'client.country',
      'client.email',
      'client.custom_value1',
      'client.custom_value2',
    ];
  }
  var data = [];

  fields.push('invoice.last_edit_date'); // ADD WIL

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var value = NINJA.renderClientOrAccountField(invoice, field);
    if (value) {
      data.push(value);
    }
  }

  return NINJA.prepareDataList(data, 'clientDetails');
};

NINJA.getPrimaryColor = function (defaultColor) {
  return NINJA.primaryColor ? NINJA.primaryColor : defaultColor;
};

NINJA.getSecondaryColor = function (defaultColor) {
  return NINJA.primaryColor ? NINJA.secondaryColor : defaultColor;
};

// remove blanks and add section style to all elements
NINJA.prepareDataList = function (oldData, section) {
  var newData = [];
  for (var i = 0; i < oldData.length; i++) {
    var item = NINJA.processItem(oldData[i], section);
    if (item.text || item.stack) {
      newData.push(item);
    }
  }
  return newData;
};

NINJA.prepareDataTable = function (oldData, section) {
  var newData = [];
  for (var i = 0; i < oldData.length; i++) {
    var row = oldData[i];
    var newRow = [];
    for (var j = 0; j < row.length; j++) {
      var item = NINJA.processItem(row[j], section);
      if (item.text || item.stack) {
        newRow.push(item);
      }
    }
    if (newRow.length) {
      newData.push(newRow);
    }
  }
  return newData;
};

NINJA.prepareDataPairs = function (oldData, section) {
  var newData = [];
  for (var i = 0; i < oldData.length; i++) {
    var row = oldData[i];
    var isBlank = false;
    for (var j = 0; j < row.length; j++) {
      var item = NINJA.processItem(row[j], section);
      if (!item.text) {
        isBlank = true;
      }
      if (j == 1) {
        NINJA.processItem(row[j], section + "Value");
      }
    }
    if (!isBlank) {
      newData.push(oldData[i]);
    }
  }
  return newData;
};

NINJA.processItem = function (item, section) {
  if (item.style && item.style instanceof Array) {
    item.style.push(section);
  } else {
    item.style = [section];
  }
  return item;
};


NINJA.parseMarkdownText = function (val, groupText) {
  var rules = [
    ['\\\*\\\*\\\*(\\\w.+?)\\\*\\\*\\\*', {'style': 'label'}], // ***value*** // MAJ WIL
    ['\\\*\\\*(\\\w.+?)\\\*\\\*', {'bold': true}], // **value**
    ['\\\*(\\\w.+?)\\\*', {'italics': true}], // *value*
    ['^###(.*)', {'style': 'help'}], // ### Small/gray help
    ['^##(.*)', {'style': 'subheader'}], // ## Header
    ['^#(.*)', {'style': 'header'}] // # Subheader
  ];

  var parts = typeof val === 'string' ? [val] : val;
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    var formatter = function (data) {
      return $.extend(data, rule[1]);
    };
    parts = NINJA.parseRegExp(parts, rule[0], formatter, true);
  }

  return parts.length > 1 ? parts : val;
};

/*
 NINJA.parseMarkdownStack = function(val)
 {
 if (val.length == 1) {
 var item = val[0];
 var line = item.hasOwnProperty('text') ? item.text : item;

 if (typeof line === 'string') {
 line = [line];
 }

 var regExp = '^\\\* (.*[\r\n|\n|\r]?)';
 var formatter = function(data) {
 return {"ul": [data.text]};
 }

 val = NINJA.parseRegExp(line, regExp, formatter, false);
 }

 return val;
 }
 */

NINJA.parseRegExp = function (val, regExpStr, formatter, groupText) {
  var regExp = new RegExp(regExpStr, 'gm');
  var parts = [];

  for (var i = 0; i < val.length; i++) {
    var line = val[i];
    parts = parts.concat(NINJA.parseRegExpLine(line, regExp, formatter, groupText));
  }

  return parts.length > 1 ? parts : val;
};

NINJA.parseRegExpLine = function (line, regExp, formatter, groupText) {
  var parts = [];
  var lastIndex = 0;

  while (match = regExp.exec(line)) {
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index));
    }
    var data = {};
    data.text = match[1];
    data = formatter(data);
    parts.push(data);
    lastIndex = match.index + match[0].length;
  }

  if (parts.length) {
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }
    return parts;
  }

  return line;
};
