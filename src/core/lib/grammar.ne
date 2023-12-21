main -> _ BOR _ {% function(d) {return d[1]} %}

# Parentheses
P -> "(" _ BOR _ ")" {% function(d) {return d[2]} %}

# Comparators
CMP -> VEQ _ EQ _ QS {% function(d) {return {l:d[0][0], op: 'EQ', r:d[4]}} %}
     | VGT _ GT _ QS {% function(d) {return {l:d[0][0], op: 'GT', r:d[4]}} %}
     | VGTN _ GT _ N {% function(d) {return {l:d[0][0], op: 'GT', r:d[4]}} %}
     | VLT _ LT _ QS {% function(d) {return {l:d[0][0], op: 'LT', r:d[4]}} %}
     | P            {% id %}


# Logical
BAND -> BAND _ AND _ CMP  {% function(d) {return {l:d[0], op:'AND', r:d[4]}} %}
     | CMP                {% id %}

BOR -> BOR _ OR _ BAND  {% function(d) {return {l:d[0], op:'OR', r:d[4]}} %}
     | BAND             {% id %}

# A string
S -> [0-9a-zA-Z-:\.]:+ {% function(d) {return d[0].join("")} %}

# A Quoted String
QS -> "'" S "'" {% function(d) {return {v:d[1]}} %}

# A INT
N -> [0-9]:+        {% function(d) {return parseInt(d[0].join(""))} %}

VEQ -> "channel" | "country" | "customerGroup"
VGT -> "date"
VGTN -> "minimumQuantity"
VLT -> "date"
AND -> "AND"
OR -> "OR"
EQ -> "="
GT -> ">="
LT -> "<="

# Whitespace
_ -> [\s]:*         {% function(d) {return null } %}