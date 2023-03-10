const formatDateJS = (t,m) => {
    if(!m) m='YYYY-MM-DD hh:mm:ss';
    var d= new Date(t*1000);
    var mmmm=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    m=m.replace('YYYY',d.getUTCFullYear());
    m=m.replace('YY',(d.getUTCFullYear() % 100 >9?'':'0')+d.getUTCFullYear() % 100);
    m=m.replace('MMMM',mmmm[d.getUTCMonth()]);
    m=m.replace('MM',((d.getUTCMonth()+1)>9?'':"0")+(d.getUTCMonth()+1));
    m=m.replace('DD',(d.getUTCDate()>9?"":"0")+d.getUTCDate());
    m=m.replace('hh',(d.getUTCHours()>9?"":"0")+d.getUTCHours());
    m=m.replace('mm',(d.getUTCMinutes()>9?"":"0")+d.getUTCMinutes());
    m=m.replace('ss',(d.getUTCSeconds()>9?"":"0")+d.getUTCSeconds());
    return m;
}
const getUnixTime = (date,form) => {
    var format = form?form:'YYYY-MM-DD hh:mm:ss';
    var Y = date.substring(format.indexOf("Y"), format.lastIndexOf("Y")+1);
    var M = date.substring(format.indexOf("M"), format.lastIndexOf("M")+1);
    var D = date.substring(format.indexOf("D"), format.lastIndexOf("D")+1);
    var h = date.substring(format.indexOf("h"), format.lastIndexOf("h")+1);
    var m = date.substring(format.indexOf("m"), format.lastIndexOf("m")+1);
    var s = date.substring(format.indexOf("s"), format.lastIndexOf("s")+1);
    if (Y.length < 4) {
        Y = "200".substring(0,4-Y.length)+""+ Y;
    }
    if(Y.match(/^\d+$/) && M.match(/^\d+$/) && D.match(/^\d+$/) && h.match(/^\d+$/) && m.match(/^\d+$/) && s.match(/^\d+$/))
    {
        Y=parseInt(Y);
        M=parseInt(M);
        D=parseInt(D);
        h=parseInt(h);
        m=parseInt(m);
        s=parseInt(s);
        if(s>=0 && s<60 && m>=0 && m<60 && h>=0 && h<24 && D>0 && D<=31 && M>0 && M<=12)
        {
            if(Y>2100) Y=2100;
            var feb=IsLeapYear(Y)?29:28;
            if((M==2 && D>feb) || (D>30 && (M==4 || M==6 || M==9 || M==11))) return false;
            //IsLeapYear(year)
            format=Date.UTC(Y,M-1,D,h,m,s) / 1000;
            return format;
        }
        return false;
    }
    return false;
}
function IsLeapYear(year) {
    if(year%4 == 0) {
        if(year%100 == 0) {
            if(year%400 == 0) {
                return true;
            }
            else
                return false;
        }
        else
            return true;
    }
    return false;
}
module.exports = {
    formatDateJS,
    getUnixTime
}
