


$(function () {
  var KEY_PRODUCTS = 'dailyDigestProducts';


  $.getJSON('products.json', function(defaultProducts) {})

  var products = load(KEY_PRODUCTS, defaultProducts);
  var editingId = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load(key, fallback) {
    try { var s = localStorage.getItem(key); if (s) return JSON.parse(s); } catch (e) {}
    return clone(fallback);
  }
  function save() {
    try {
      localStorage.setItem(KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {}
  }
  function money(n) { return '$' + Number(n).toFixed(2); }
  function findProduct(id) { return $.grep(products, function (p) { return p.id === id; })[0]; }
  function nextId() { return products.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1; }

  // Keep the cart consistent with the products (removed items, reduced stock)

  function matches(p) {
    var q = $.trim($('#searchInput').val()).toLowerCase();
    var cat = $('#category').val();
    if (cat && p.category !== cat) return false;
    if (q && (p.name + ' ' + p.category + ' ' + p.description).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }


  function inputLabel(text, name, value, type) {
    var $i = $('<input>').attr({ type: type || 'text', name: name }).val(value);
    if (type === 'number') $i.attr({ min: 0, step: name === 'price' ? '0.01' : '1' });
    return $('<label>').text(text).append($i);
  }




  function renderProducts() {
    var $g = $('#grid').empty();
    var shown = sorted($.grep(products, matches));
    $.each(shown, function (_, p) { $g.append(buildProduct(p)); });
    if (!shown.length) $g.append($('<div class="empty">').text('No products match your search.'));
    $('#count').text('Showing ' + shown.length + ' of ' + products.length + ' products');
    $('#json-out').text(JSON.stringify(products, null, 2));
  }

  
  

  

  // Search, filter and sort

  // Product actions (delegated because the grid is re-rendered)
  $('#grid').on('click', '.edit', function () {
    editingId = $(this).closest('.product').data('id'); renderProducts();
  });
  $('#grid').on('click', '.cancel', function () { editingId = null; renderProducts(); });
  $('#grid').on('click', '.delete', function () {
    var id = $(this).closest('.product').data('id'), p = findProduct(id);
    if (confirm('Delete "' + p.name + '"?')) {
      products = $.grep(products, function (x) { return x.id !== id; });
      refresh();
    }
  });




});
