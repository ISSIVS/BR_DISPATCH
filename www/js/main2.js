$(function () {
  $("#datepicker").datepicker({ 
        autoclose: true, 
        todayHighlight: true
  }).datepicker('update', new Date());
});
 $(function() {
    $('#datetimepicker1').datetimepicker({
      language: 'pt-BR'
    });
  });

  $('#datetimepicker').datetimepicker({
        format: 'dd/MM/yyyy hh:mm:ss'
     
      });

  /*
 * https://github.com/ispal/vue-timepickr
 */
Vue.component('timepicker', window.VueTimepickr.default);

new Vue({
  el: '#app',
  data: ({
    time: '13:20'
  })
});