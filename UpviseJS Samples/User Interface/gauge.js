Config.appid = "demogauge";
Config.version = "1";
Config.title = "Demo Gauge";

function leftpane() {
  List.show("leftpane");
}

function main() {
  var html = Gauge.add("24%", 0, 97, Color.BLUE);
  WebView.showUi(html);
}

///// GAUGUE.js

 class Gauge {
        static _polarToCartesian(cx, cy, radius, degrees) {
            const radians = (degrees-90) * Math.PI / 180.0;
                return {
                    x: cx + (radius * Math.cos(radians)),
                    y: cy + (radius * Math.sin(radians))
                };
        }

        static _describeArc(cx, cy, radius, startAngle, endAngle){
            const start = Gauge._polarToCartesian(cx, cy, radius, endAngle);
            const end = Gauge._polarToCartesian(cx, cy, radius, startAngle);
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
            const d = [
                "M", start.x, start.y, 
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
            ].join(" ");
            return d;       
        }

        static add(value, startAngle, endAngle, color) {  
            const cx = 50;
            const cy = 50;
            const radius = 40;
            const backColor = "#F1F1F1";
            let dBack = Gauge._describeArc(cx, cy, radius, 1, 360);
            let d = Gauge._describeArc(cx, cy, radius, startAngle, endAngle);
            let buf = [];
            buf.push('<svg viewBox="0 0 100 100">');
            buf.push('<path fill="none" stroke="', backColor, '" stroke-width="', Gauge.THICKNESS, '" d="', dBack, '" />');
            buf.push('<path fill="none" stroke="', color, '" stroke-linecap="round" stroke-width="', Gauge.THICKNESS, '" d="', d, '" />');   
            buf.push('<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="', color, '">', value, '</text>');
            buf.push('</svg>');
            return buf.join('');
        }  
    }  
    
    Gauge.THICKNESS = 5;
     
/////


