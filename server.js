'use strict';
const http = require('http');
const cfg = require('./config');
const S = require('./shopify');
const PORT = process.env.PORT || 3000;
const UI_HTML = Buffer.from("PCFkb2N0eXBlIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9InV0Zi04Ij4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xIj4KPHRpdGxlPkRpZ2lzdGV4IOKAlCBQaXBlbGluZXM8L3RpdGxlPgo8c3R5bGU+Cjpyb290e2NvbG9yLXNjaGVtZTpsaWdodDstLWluazojMTYxYjI2Oy0tbXV0OiM1YjY0NzI7LS1saW5lOiNlNmU5ZWY7LS1jYXJkOiNmZmY7LS1iZzojZjZmN2Y5OwogIC0tYnJhbmQ6IzJmNmRmNjstLWJyYW5kYmc6I2VhZjFmZjstLWdvb2Q6IzEyN2EzZTstLWdvb2RiZzojZTdmNmVjOy0td2FybmJnOiNmZmY0ZGU7LS13YXJuOiM4YTVhMDA7fQoqe2JveC1zaXppbmc6Ym9yZGVyLWJveH0KYm9keXttYXJnaW46MDtiYWNrZ3JvdW5kOnZhcigtLWJnKTtjb2xvcjp2YXIoLS1pbmspO2ZvbnQ6MTRweC8xLjUgLWFwcGxlLXN5c3RlbSxTZWdvZSBVSSxSb2JvdG8sSGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWZ9Ci53cmFwe21heC13aWR0aDo5NjBweDttYXJnaW46MCBhdXRvO3BhZGRpbmc6MjJweCAxOHB4IDYwcHh9Cmgxe2ZvbnQtc2l6ZToyMHB4O21hcmdpbjowIDAgMnB4fQouc3Vie2NvbG9yOnZhcigtLW11dCk7Zm9udC1zaXplOjEzcHg7bWFyZ2luLWJvdHRvbToyMHB4fQouY2FyZHtiYWNrZ3JvdW5kOnZhcigtLWNhcmQpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czoxNHB4O3BhZGRpbmc6MThweDttYXJnaW4tYm90dG9tOjE4cHh9Ci5jYXJkIGgye2ZvbnQtc2l6ZToxNHB4O21hcmdpbjowIDAgMTRweDtsZXR0ZXItc3BhY2luZzouMDJlbX0KbGFiZWx7ZGlzcGxheTpibG9jaztmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1tdXQpO3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtsZXR0ZXItc3BhY2luZzouMDRlbTttYXJnaW4tYm90dG9tOjZweH0KLnJvd3tkaXNwbGF5OmZsZXg7Z2FwOjE0cHg7ZmxleC13cmFwOndyYXB9Ci5yb3c+ZGl2e2ZsZXg6MTttaW4td2lkdGg6MTcwcHg7bWFyZ2luLWJvdHRvbToxMnB4fQpzZWxlY3QsaW5wdXR7d2lkdGg6MTAwJTtwYWRkaW5nOjlweCAxMXB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czo5cHg7YmFja2dyb3VuZDojZmZmO2ZvbnQ6aW5oZXJpdDtjb2xvcjp2YXIoLS1pbmspfQouc2Vne2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwfQouc2VnIGJ1dHRvbntmbGV4OjE7bWluLXdpZHRoOjEyMHB4O3BhZGRpbmc6MTBweDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6OXB4O2JhY2tncm91bmQ6I2ZmZjtjdXJzb3I6cG9pbnRlcjtmb250OmluaGVyaXQ7Y29sb3I6dmFyKC0taW5rKX0KLnNlZyBidXR0b24ub257Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKTtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kYmcpO2NvbG9yOnZhcigtLWJyYW5kKTtmb250LXdlaWdodDo2MDB9Ci5hY3Rpb25ze2Rpc3BsYXk6ZmxleDtnYXA6MTBweDttYXJnaW4tdG9wOjZweDtmbGV4LXdyYXA6d3JhcH0KYnV0dG9uLnByaXtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWJyYW5kKTtjb2xvcjojZmZmO3BhZGRpbmc6MTBweCAxNnB4O2JvcmRlci1yYWRpdXM6OXB4O2N1cnNvcjpwb2ludGVyO2ZvbnQ6aW5oZXJpdDtmb250LXdlaWdodDo2MDB9CmJ1dHRvbi5zZWN7YmFja2dyb3VuZDojZmZmO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Y29sb3I6dmFyKC0taW5rKTtwYWRkaW5nOjEwcHggMTZweDtib3JkZXItcmFkaXVzOjlweDtjdXJzb3I6cG9pbnRlcjtmb250OmluaGVyaXR9CmJ1dHRvbjpkaXNhYmxlZHtvcGFjaXR5Oi41O2N1cnNvcjpkZWZhdWx0fQouaGlkZXtkaXNwbGF5Om5vbmV9Ci5zdW1tYXJ5e2JhY2tncm91bmQ6dmFyKC0tZ29vZGJnKTtjb2xvcjp2YXIoLS1nb29kKTtib3JkZXItcmFkaXVzOjlweDtwYWRkaW5nOjEwcHggMTJweDtmb250LXdlaWdodDo2MDA7bWFyZ2luLWJvdHRvbToxMnB4O2ZvbnQtc2l6ZToxM3B4fQouc3VtbWFyeS5lcnJ7YmFja2dyb3VuZDojZmRlY2VhO2NvbG9yOiNiMzI2MWV9CnRhYmxle3dpZHRoOjEwMCU7Ym9yZGVyLWNvbGxhcHNlOmNvbGxhcHNlO2ZvbnQtc2l6ZToxMi41cHh9CnRoLHRke3BhZGRpbmc6OHB4IDEwcHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSk7dGV4dC1hbGlnbjpsZWZ0O3doaXRlLXNwYWNlOm5vd3JhcDtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczttYXgtd2lkdGg6MjAwcHh9CnRoe2NvbG9yOnZhcigtLW11dCk7Zm9udC1zaXplOjExcHg7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi4wM2VtO3Bvc2l0aW9uOnN0aWNreTt0b3A6MDtiYWNrZ3JvdW5kOiNmZmZ9Ci50YWJsZXdyYXB7b3ZlcmZsb3c6YXV0bzttYXgtaGVpZ2h0OjM0MHB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czoxMHB4fQouZGx7ZGlzcGxheTpmbGV4O2dhcDoxMHB4O21hcmdpbi10b3A6MTJweDtmbGV4LXdyYXA6d3JhcH0KLnBpcGV7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDtwYWRkaW5nOjEycHg7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOjEwcHg7bWFyZ2luLWJvdHRvbTo4cHg7ZmxleC13cmFwOndyYXB9Ci5waXBlIC5ubXtmb250LXdlaWdodDo2MDB9LnBpcGUgLm1ldGF7Y29sb3I6dmFyKC0tbXV0KTtmb250LXNpemU6MTJweH0KLnBpcGUgLnNwe2ZsZXg6MX0KLm11dHtjb2xvcjp2YXIoLS1tdXQpO2ZvbnQtc2l6ZToxMnB4fQoudGFne2Rpc3BsYXk6aW5saW5lLWJsb2NrO2JhY2tncm91bmQ6I2VlZjFmNjtjb2xvcjojNTU2MDZmO2JvcmRlci1yYWRpdXM6MjBweDtwYWRkaW5nOjFweCA4cHg7Zm9udC1zaXplOjExcHg7bWFyZ2luLWxlZnQ6NnB4fQoudGFnLmZyZXF7YmFja2dyb3VuZDp2YXIoLS1nb29kYmcpO2NvbG9yOnZhcigtLWdvb2QpfQphLmxpbmt7Y29sb3I6dmFyKC0tYnJhbmQpO3RleHQtZGVjb3JhdGlvbjpub25lfQo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5Pgo8ZGl2IGNsYXNzPSJ3cmFwIj4KICA8aDE+RGlnaXN0ZXgg4oCUIFNob3BpZnkg4oaSIEdvb2dsZSBBZHMgUGlwZWxpbmVzPC9oMT4KICA8ZGl2IGNsYXNzPSJzdWIiPkRlZmluZSB3aGF0IHRvIHB1bGwsIG92ZXIgd2hhdCB3aW5kb3csIHRoZSBjb252ZXJzaW9uIGFjdGlvbiwgYW5kIGhvdyBvZnRlbi4gUnVuIG9uIGRlbWFuZCBvciBzY2hlZHVsZSBpdC48L2Rpdj4KCiAgPGRpdiBjbGFzcz0iY2FyZCI+CiAgICA8aDI+QlVJTEQgQSBQVUxMPC9oMj4KICAgIDxkaXYgY2xhc3M9InJvdyI+CiAgICAgIDxkaXY+PGxhYmVsPlBpcGVsaW5lIG5hbWU8L2xhYmVsPjxpbnB1dCBpZD0icG5hbWUiIHBsYWNlaG9sZGVyPSJlLmcuIFByYW1vZ2ggcHJlcGFpZCDihpIgQ1JNLVBVUkNIQVNFIj48L2Rpdj4KICAgICAgPGRpdj48bGFiZWw+U3RvcmU8L2xhYmVsPjxzZWxlY3QgaWQ9ImNsaWVudCI+PC9zZWxlY3Q+PC9kaXY+CiAgICA8L2Rpdj4KICAgIDxsYWJlbD5XaGF0IHRvIHB1bGw8L2xhYmVsPgogICAgPGRpdiBjbGFzcz0ic2VnIiBpZD0idHlwZXNlZyIgc3R5bGU9Im1hcmdpbi1ib3R0b206MTRweCI+CiAgICAgIDxidXR0b24gZGF0YS10eXBlPSJvcmRlcnMiIGNsYXNzPSJvbiI+QWxsIG9yZGVyczwvYnV0dG9uPgogICAgICA8YnV0dG9uIGRhdGEtdHlwZT0icHJlcGFpZCI+UHJlcGFpZCBvcmRlcnMgb25seTwvYnV0dG9uPgogICAgICA8YnV0dG9uIGRhdGEtdHlwZT0iY29udGFjdHMiPkNvbnRhY3RzPC9idXR0b24+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9InJvdyI+CiAgICAgIDxkaXY+CiAgICAgICAgPGxhYmVsPlRpbWUgcGVyaW9kPC9sYWJlbD4KICAgICAgICA8c2VsZWN0IGlkPSJkYXlzIj48b3B0aW9uIHZhbHVlPSI3Ij5MYXN0IDcgZGF5czwvb3B0aW9uPjxvcHRpb24gdmFsdWU9IjE0Ij5MYXN0IDE0IGRheXM8L29wdGlvbj48b3B0aW9uIHZhbHVlPSIzMCIgc2VsZWN0ZWQ+TGFzdCAzMCBkYXlzPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0iOTAiPkxhc3QgOTAgZGF5czwvb3B0aW9uPjwvc2VsZWN0PgogICAgICA8L2Rpdj4KICAgICAgPGRpdj4KICAgICAgICA8bGFiZWw+RnJlcXVlbmN5IChzY2hlZHVsZSk8L2xhYmVsPgogICAgICAgIDxzZWxlY3QgaWQ9ImZyZXEiPjxvcHRpb24gdmFsdWU9Im9mZiIgc2VsZWN0ZWQ+T2ZmIChvbiBkZW1hbmQpPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0iZGFpbHkiPkRhaWx5PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0id2Vla2x5Ij5XZWVrbHkgKE1vbik8L29wdGlvbj48L3NlbGVjdD4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgaWQ9ImNvbnZ3cmFwIj48bGFiZWwgaWQ9ImNvbnZsYWJlbCI+R29vZ2xlIEFkcyBjb252ZXJzaW9uIGFjdGlvbjwvbGFiZWw+PGlucHV0IGlkPSJjb252IiB2YWx1ZT0iQ1JNLVBVUkNIQVNFIj48L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0iYWN0aW9ucyI+CiAgICAgIDxidXR0b24gY2xhc3M9InByaSIgaWQ9InJ1biI+UnVuIG5vdzwvYnV0dG9uPgogICAgICA8YnV0dG9uIGNsYXNzPSJzZWMiIGlkPSJzYXZlIj5TYXZlIC8gc2NoZWR1bGUgcGlwZWxpbmU8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8ZGl2IGNsYXNzPSJjYXJkIGhpZGUiIGlkPSJyZXN1bHRzIj4KICAgIDxoMj5SRVNVTFQ8L2gyPgogICAgPGRpdiBjbGFzcz0ic3VtbWFyeSIgaWQ9InN1bW1hcnkiPjwvZGl2PgogICAgPGRpdiBjbGFzcz0idGFibGV3cmFwIj48dGFibGUgaWQ9InRibCI+PHRoZWFkPjwvdGhlYWQ+PHRib2R5PjwvdGJvZHk+PC90YWJsZT48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImRsIj4KICAgICAgPGJ1dHRvbiBjbGFzcz0ic2VjIiBpZD0iZGxEYXRhIj5Eb3dubG9hZCBkYXRhIChDU1YpPC9idXR0b24+CiAgICAgIDxidXR0b24gY2xhc3M9InByaSIgaWQ9ImRsR2FkcyI+RG93bmxvYWQgR29vZ2xlIEFkcyBDU1Y8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8ZGl2IGNsYXNzPSJjYXJkIj4KICAgIDxoMj5TQVZFRCBQSVBFTElORVM8L2gyPgogICAgPGRpdiBpZD0icGlwZXMiPjwvZGl2PgogICAgPGRpdiBjbGFzcz0ibXV0IiBpZD0ibm9waXBlcyI+Tm8gcGlwZWxpbmVzIHNhdmVkIHlldC4gQ29uZmlndXJlIGEgcHVsbCBhYm92ZSBhbmQgY2xpY2sg4oCcU2F2ZSAvIHNjaGVkdWxlIHBpcGVsaW5l4oCdLjwvZGl2PgogIDwvZGl2PgoKICA8ZGl2IGNsYXNzPSJjYXJkIj4KICAgIDxoMj5CQUNLVVBTICZuYnNwOzxzcGFuIGNsYXNzPSJtdXQiIHN0eWxlPSJ0ZXh0LXRyYW5zZm9ybTpub25lO2xldHRlci1zcGFjaW5nOjAiPuKAlCBmaWxlcyB3cml0dGVuIGJ5IHRoZSBkYWlseSBzY2hlZHVsZTwvc3Bhbj48L2gyPgogICAgPGRpdiBjbGFzcz0iYWN0aW9ucyI+PGJ1dHRvbiBjbGFzcz0ic2VjIiBpZD0ibG9hZEJhY2t1cHMiPkxvYWQgYmFja3VwczwvYnV0dG9uPjwvZGl2PgogICAgPGRpdiBpZD0iYmFja3VwcyIgY2xhc3M9Im11dCIgc3R5bGU9Im1hcmdpbi10b3A6MTBweCI+PC9kaXY+CiAgPC9kaXY+CgogIDxkaXYgY2xhc3M9ImNhcmQiPgogICAgPGgyPk1BTkFHRSBDTElFTlRTICZuYnNwOzxzcGFuIGNsYXNzPSJtdXQiIHN0eWxlPSJ0ZXh0LXRyYW5zZm9ybTpub25lO2xldHRlci1zcGFjaW5nOjAiPuKAlCBhZGRzIGEgYnJhbmQgdG8gQ0xJRU5UU19KU09OICZhbXA7IHJlZGVwbG95czwvc3Bhbj48L2gyPgogICAgPGRpdiBjbGFzcz0icm93Ij4KICAgICAgPGRpdj48bGFiZWw+Q2xpZW50IG5hbWU8L2xhYmVsPjxpbnB1dCBpZD0iY19uYW1lIiBwbGFjZWhvbGRlcj0iZS5nLiBBZW5hayI+PC9kaXY+CiAgICAgIDxkaXY+PGxhYmVsPlNob3BpZnkgc3RvcmUgZG9tYWluPC9sYWJlbD48aW5wdXQgaWQ9ImNfc3RvcmUiIHBsYWNlaG9sZGVyPSJhZW5hay5teXNob3BpZnkuY29tIj48L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0icm93Ij4KICAgICAgPGRpdj48bGFiZWw+U2hvcGlmeSBDbGllbnQgSUQ8L2xhYmVsPjxpbnB1dCBpZD0iY19jaWQiPjwvZGl2PgogICAgICA8ZGl2PjxsYWJlbD5TaG9waWZ5IENsaWVudCBTZWNyZXQ8L2xhYmVsPjxpbnB1dCBpZD0iY19zZWNyZXQiIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0icm93Ij4KICAgICAgPGRpdj48bGFiZWw+R29vZ2xlIEFkcyBDdXN0b21lciBJRCAob3B0aW9uYWwpPC9sYWJlbD48aW5wdXQgaWQ9ImNfZ2FkcyIgcGxhY2Vob2xkZXI9ImRpZ2l0cyBvbmx5Ij48L2Rpdj4KICAgICAgPGRpdj48bGFiZWw+QWRtaW4gcGFzc3dvcmQ8L2xhYmVsPjxpbnB1dCBpZD0iY19hZG1pbiIgdHlwZT0icGFzc3dvcmQiIHBsYWNlaG9sZGVyPSJBRE1JTl9QQVNTV09SRCI+PC9kaXY+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImFjdGlvbnMiPjxidXR0b24gY2xhc3M9InByaSIgaWQ9ImNfYWRkIj5BZGQgY2xpZW50PC9idXR0b24+PC9kaXY+CiAgICA8ZGl2IGlkPSJjX21zZyIgY2xhc3M9Im11dCIgc3R5bGU9Im1hcmdpbi10b3A6MTBweCI+PC9kaXY+CiAgPC9kaXY+CgogIDxkaXYgY2xhc3M9Im11dCI+QmFja2VuZDogPGEgY2xhc3M9ImxpbmsiIGhyZWY9Ii9kaWFnIj4vZGlhZzwvYT4gwrcgZGFpbHkgc2NoZWR1bGUgcnVucyB+NiBBTSBJU1Qgwrcga2V5cyBzdG9yZWQgaW4gVmVyY2VsLjwvZGl2Pgo8L2Rpdj4KCjxzY3JpcHQ+CnZhciBzdGF0ZSA9IHsgdHlwZTonb3JkZXJzJywgbGFzdDpudWxsIH07CmZ1bmN0aW9uICQoaWQpeyByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOyB9CmZ1bmN0aW9uIHR5cGVMYWJlbCh0KXsgcmV0dXJuIHQ9PT0nb3JkZXJzJz8nQWxsIG9yZGVycyc6dD09PSdwcmVwYWlkJz8nUHJlcGFpZCBvcmRlcnMgb25seSc6J0NvbnRhY3RzJzsgfQpmdW5jdGlvbiBpc09yZGVyVHlwZSh0KXsgcmV0dXJuIHQ9PT0nb3JkZXJzJ3x8dD09PSdwcmVwYWlkJzsgfQpmdW5jdGlvbiBzbHVnKHMpeyByZXR1cm4gU3RyaW5nKHMpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXowLTldKy9nLCdfJykucmVwbGFjZSgvXl98XyQvZywnJyk7IH0KZnVuY3Rpb24gZ2V0QWRtaW4oKXsgdmFyIGE9bG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FkbWluX3B3Jyk7IGlmKCFhKXsgYT1wcm9tcHQoJ0FkbWluIHBhc3N3b3JkIChBRE1JTl9QQVNTV09SRCk6Jyl8fCcnOyBpZihhKSBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWRtaW5fcHcnLGEpOyB9IHJldHVybiBhOyB9Cgpkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjdHlwZXNlZyBidXR0b24nKS5mb3JFYWNoKGZ1bmN0aW9uKGIpewogIGIub25jbGljaz1mdW5jdGlvbigpewogICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI3R5cGVzZWcgYnV0dG9uJykuZm9yRWFjaChmdW5jdGlvbih4KXt4LmNsYXNzTGlzdC5yZW1vdmUoJ29uJyk7fSk7CiAgICBiLmNsYXNzTGlzdC5hZGQoJ29uJyk7IHN0YXRlLnR5cGU9Yi5nZXRBdHRyaWJ1dGUoJ2RhdGEtdHlwZScpOwogICAgJCgnY29udmxhYmVsJykudGV4dENvbnRlbnQ9aXNPcmRlclR5cGUoc3RhdGUudHlwZSk/J0dvb2dsZSBBZHMgY29udmVyc2lvbiBhY3Rpb24nOidHb29nbGUgQWRzIGNvbnZlcnNpb24gYWN0aW9uIChsZWFkKSc7CiAgfTsKfSk7CgpmZXRjaCgnL2NsaWVudHMnKS50aGVuKGZ1bmN0aW9uKHIpe3JldHVybiByLmpzb24oKTt9KS50aGVuKGZ1bmN0aW9uKGQpewogIHZhciBzZWw9JCgnY2xpZW50Jyk7IChkLmNsaWVudHN8fFtdKS5mb3JFYWNoKGZ1bmN0aW9uKGMpeyB2YXIgbz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTsgby52YWx1ZT1jLm5hbWU7IG8udGV4dENvbnRlbnQ9Yy5uYW1lKycgKCcrYy5zdG9yZSsnKSc7IHNlbC5hcHBlbmRDaGlsZChvKTsgfSk7CiAgaWYoIWQuY2xpZW50c3x8IWQuY2xpZW50cy5sZW5ndGgpeyB2YXIgbz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTsgby50ZXh0Q29udGVudD0nTm8gc3RvcmUg4oCUIGFkZCBvbmUgYmVsb3cnOyBzZWwuYXBwZW5kQ2hpbGQobyk7IH0KfSkuY2F0Y2goZnVuY3Rpb24oKXt9KTsKCmZ1bmN0aW9uIGN1cnJlbnRDb25maWcoKXsKICByZXR1cm4geyBuYW1lOiQoJ3BuYW1lJykudmFsdWUudHJpbSgpfHwoJ1ByYW1vZ2ggJyt0eXBlTGFiZWwoc3RhdGUudHlwZSkpLCBjbGllbnQ6JCgnY2xpZW50JykudmFsdWUsCiAgICB0eXBlOnN0YXRlLnR5cGUsIGRheXM6cGFyc2VJbnQoJCgnZGF5cycpLnZhbHVlLDEwKSwgY29udjokKCdjb252JykudmFsdWUudHJpbSgpfHwnQ1JNLVBVUkNIQVNFJywgZnJlcXVlbmN5OiQoJ2ZyZXEnKS52YWx1ZSB9Owp9CmZ1bmN0aW9uIGNzdihyb3dzKXsgdmFyIGVzYz1mdW5jdGlvbih2KXt2PVN0cmluZyh2PT1udWxsPycnOnYpO3JldHVybiAvWyIsXG5dLy50ZXN0KHYpPyciJyt2LnJlcGxhY2UoLyIvZywnIiInKSsnIic6djt9OyByZXR1cm4gcm93cy5tYXAoZnVuY3Rpb24ocil7cmV0dXJuIHIubWFwKGVzYykuam9pbignLCcpO30pLmpvaW4oJ1xuJyk7IH0KZnVuY3Rpb24gZG93bmxvYWQobmFtZSx0ZXh0KXsgdmFyIGI9bmV3IEJsb2IoW3RleHRdLHt0eXBlOid0ZXh0L2Nzdid9KSx1PVVSTC5jcmVhdGVPYmplY3RVUkwoYiksYT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7IGEuaHJlZj11O2EuZG93bmxvYWQ9bmFtZTthLmNsaWNrKCk7IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtVUkwucmV2b2tlT2JqZWN0VVJMKHUpO30sMTUwMCk7IH0KCmZ1bmN0aW9uIHJ1bkNvbmZpZyhjZmcpewogICQoJ3Jlc3VsdHMnKS5jbGFzc0xpc3QucmVtb3ZlKCdoaWRlJyk7ICQoJ3N1bW1hcnknKS5jbGFzc05hbWU9J3N1bW1hcnknOyAkKCdzdW1tYXJ5JykudGV4dENvbnRlbnQ9J1J1bm5pbmfigKYnOwogICQoJ3RibCcpLnF1ZXJ5U2VsZWN0b3IoJ3RoZWFkJykuaW5uZXJIVE1MPScnOyAkKCd0YmwnKS5xdWVyeVNlbGVjdG9yKCd0Ym9keScpLmlubmVySFRNTD0nJzsKICByZXR1cm4gZmV0Y2goJy9wdWxsP3R5cGU9JytjZmcudHlwZSsnJmRheXM9JytjZmcuZGF5cysnJmNsaWVudD0nK2VuY29kZVVSSUNvbXBvbmVudChjZmcuY2xpZW50KSkudGhlbihmdW5jdGlvbihyKXtyZXR1cm4gci5qc29uKCk7fSkudGhlbihmdW5jdGlvbihkKXsKICAgIGlmKGQuZXJyb3IpeyAkKCdzdW1tYXJ5JykuY2xhc3NOYW1lPSdzdW1tYXJ5IGVycic7ICQoJ3N1bW1hcnknKS50ZXh0Q29udGVudD0nRXJyb3I6ICcrZC5lcnJvcjsgcmV0dXJuOyB9CiAgICBzdGF0ZS5sYXN0PXtjZmc6Y2ZnLGRhdGE6ZH07CiAgICB2YXIgZXh0cmE9aXNPcmRlclR5cGUoY2ZnLnR5cGUpPygnIMK3ICcrKGQuZ2NsaWRDb3VudHx8MCkrJyB3aXRoIGdjbGlkIOKGkiAnK2NmZy5jb252KTooJyDihpIgJytjZmcuY29udisnIChsZWFkcyknKTsKICAgICQoJ3N1bW1hcnknKS50ZXh0Q29udGVudD1jZmcuY2xpZW50KycgwrcgJyt0eXBlTGFiZWwoY2ZnLnR5cGUpKycgwrcgbGFzdCAnK2NmZy5kYXlzKycgZGF5cyDihpIgJytkLmNvdW50KycgcmVjb3JkcycrZXh0cmE7CiAgICB2YXIgdGhlYWQ9JCgndGJsJykucXVlcnlTZWxlY3RvcigndGhlYWQnKSx0Yj0kKCd0YmwnKS5xdWVyeVNlbGVjdG9yKCd0Ym9keScpOwogICAgdGhlYWQuaW5uZXJIVE1MPSc8dHI+JytkLmNvbHVtbnMubWFwKGZ1bmN0aW9uKGMpe3JldHVybiAnPHRoPicrYysnPC90aD4nO30pLmpvaW4oJycpKyc8L3RyPic7CiAgICB0Yi5pbm5lckhUTUw9ZC5yb3dzLnNsaWNlKDAsMTIpLm1hcChmdW5jdGlvbihyb3cpe3JldHVybiAnPHRyPicrcm93Lm1hcChmdW5jdGlvbihjKXtyZXR1cm4gJzx0ZD4nKyhjPT1udWxsPycnOlN0cmluZyhjKSkrJzwvdGQ+Jzt9KS5qb2luKCcnKSsnPC90cj4nO30pLmpvaW4oJycpOwogICAgJCgnZGxHYWRzJykuc3R5bGUuZGlzcGxheT0nJzsgJCgnZGxHYWRzJykudGV4dENvbnRlbnQ9aXNPcmRlclR5cGUoY2ZnLnR5cGUpPydEb3dubG9hZCBHb29nbGUgQWRzIENTVic6J0Rvd25sb2FkIEdvb2dsZSBBZHMgbGVhZHMgQ1NWJzsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgJCgnc3VtbWFyeScpLmNsYXNzTmFtZT0nc3VtbWFyeSBlcnInOyAkKCdzdW1tYXJ5JykudGV4dENvbnRlbnQ9J0Vycm9yOiAnK2UubWVzc2FnZTsgfSk7Cn0KJCgncnVuJykub25jbGljaz1mdW5jdGlvbigpeyBydW5Db25maWcoY3VycmVudENvbmZpZygpKTsgfTsKJCgnZGxEYXRhJykub25jbGljaz1mdW5jdGlvbigpeyBpZighc3RhdGUubGFzdClyZXR1cm47IHZhciBkPXN0YXRlLmxhc3QuZGF0YSxjZmc9c3RhdGUubGFzdC5jZmc7IGRvd25sb2FkKHNsdWcoY2ZnLm5hbWUpKydfJytjZmcudHlwZSsnXycrY2ZnLmRheXMrJ2QuY3N2JywgY3N2KFtkLmNvbHVtbnNdLmNvbmNhdChkLnJvd3MpKSk7IH07CiQoJ2RsR2FkcycpLm9uY2xpY2s9ZnVuY3Rpb24oKXsKICBpZighc3RhdGUubGFzdClyZXR1cm47IHZhciBkPXN0YXRlLmxhc3QuZGF0YSxjZmc9c3RhdGUubGFzdC5jZmc7CiAgaWYoaXNPcmRlclR5cGUoY2ZnLnR5cGUpKXsgdmFyIGg9WydHb29nbGUgQ2xpY2sgSUQnLCdDb252ZXJzaW9uIE5hbWUnLCdDb252ZXJzaW9uIFRpbWUnLCdDb252ZXJzaW9uIFZhbHVlJywnQ29udmVyc2lvbiBDdXJyZW5jeScsJ0VtYWlsJ107IHZhciByPShkLmNvbnZlcnNpb25zfHxbXSkubWFwKGZ1bmN0aW9uKGMpe3JldHVybiBbYy5nY2xpZCxjZmcuY29udixjLnRpbWUsYy52YWx1ZSxjLmN1cnJlbmN5LGMuZW1haWxdO30pOyBkb3dubG9hZChzbHVnKGNmZy5uYW1lKSsnX2dvb2dsZV9hZHMuY3N2JywgY3N2KFtoXS5jb25jYXQocikpKTsgfQogIGVsc2UgeyB2YXIgaDI9WydDb252ZXJzaW9uIE5hbWUnLCdDb252ZXJzaW9uIFRpbWUnLCdFbWFpbCcsJ1Bob25lIE51bWJlciddOyB2YXIgcjI9KGQucm93c3x8W10pLm1hcChmdW5jdGlvbihyb3cpe3JldHVybiBbY2ZnLmNvbnYscm93WzVdLHJvd1swXSxyb3dbMl1dO30pOyBkb3dubG9hZChzbHVnKGNmZy5uYW1lKSsnX2dvb2dsZV9hZHNfbGVhZHMuY3N2JywgY3N2KFtoMl0uY29uY2F0KHIyKSkpOyB9Cn07CgovLyAtLS0tIHNlcnZlci1iYWNrZWQgcGlwZWxpbmVzIC0tLS0KZnVuY3Rpb24gYXBwbHlDb25maWcocGwpewogICQoJ3BuYW1lJykudmFsdWU9cGwubmFtZTsgaWYocGwuY2xpZW50KSQoJ2NsaWVudCcpLnZhbHVlPXBsLmNsaWVudDsgJCgnZGF5cycpLnZhbHVlPXBsLmRheXM7ICQoJ2NvbnYnKS52YWx1ZT1wbC5jb252OyAkKCdmcmVxJykudmFsdWU9cGwuZnJlcXVlbmN5fHwnb2ZmJzsKICBzdGF0ZS50eXBlPXBsLnR5cGU7IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyN0eXBlc2VnIGJ1dHRvbicpLmZvckVhY2goZnVuY3Rpb24oeCl7IHguY2xhc3NMaXN0LnRvZ2dsZSgnb24nLCB4LmdldEF0dHJpYnV0ZSgnZGF0YS10eXBlJyk9PT1wbC50eXBlKTsgfSk7CiAgJCgnY29udmxhYmVsJykudGV4dENvbnRlbnQ9aXNPcmRlclR5cGUocGwudHlwZSk/J0dvb2dsZSBBZHMgY29udmVyc2lvbiBhY3Rpb24nOidHb29nbGUgQWRzIGNvbnZlcnNpb24gYWN0aW9uIChsZWFkKSc7Cn0KZnVuY3Rpb24gcmVuZGVyUGlwZXMobGlzdCl7CiAgdmFyIGJveD0kKCdwaXBlcycpOyBib3guaW5uZXJIVE1MPScnOyAkKCdub3BpcGVzJykuc3R5bGUuZGlzcGxheT1saXN0Lmxlbmd0aD8nbm9uZSc6Jyc7CiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHBsKXsKICAgIHZhciBlbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsgZWwuY2xhc3NOYW1lPSdwaXBlJzsKICAgIHZhciBmcmVxPShwbC5mcmVxdWVuY3kmJnBsLmZyZXF1ZW5jeSE9PSdvZmYnKT8oJzxzcGFuIGNsYXNzPSJ0YWcgZnJlcSI+JytwbC5mcmVxdWVuY3krJzwvc3Bhbj4nKTonPHNwYW4gY2xhc3M9InRhZyI+b24gZGVtYW5kPC9zcGFuPic7CiAgICBlbC5pbm5lckhUTUw9JzxkaXY+PGRpdiBjbGFzcz0ibm0iPicrcGwubmFtZSsnIDxzcGFuIGNsYXNzPSJ0YWciPicrcGwuY29udisnPC9zcGFuPicrZnJlcSsnPC9kaXY+PGRpdiBjbGFzcz0ibWV0YSI+JytwbC5jbGllbnQrJyDCtyAnK3R5cGVMYWJlbChwbC50eXBlKSsnIMK3IGxhc3QgJytwbC5kYXlzKycgZGF5czwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9InNwIj48L2Rpdj4nKwogICAgICAnPGJ1dHRvbiBjbGFzcz0ic2VjIiBkYXRhLXJ1bj0iJytlbmNvZGVVUklDb21wb25lbnQocGwubmFtZSkrJyI+UnVuPC9idXR0b24+PGJ1dHRvbiBjbGFzcz0ic2VjIiBkYXRhLWRlbD0iJytlbmNvZGVVUklDb21wb25lbnQocGwubmFtZSkrJyI+RGVsZXRlPC9idXR0b24+JzsKICAgIGJveC5hcHBlbmRDaGlsZChlbCk7CiAgfSk7CiAgYm94LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXJ1bl0nKS5mb3JFYWNoKGZ1bmN0aW9uKGIpeyBiLm9uY2xpY2s9ZnVuY3Rpb24oKXsgdmFyIG49ZGVjb2RlVVJJQ29tcG9uZW50KGIuZ2V0QXR0cmlidXRlKCdkYXRhLXJ1bicpKTsgdmFyIHBsPSh3aW5kb3cuX3BpcGVzfHxbXSkuZmluZChmdW5jdGlvbih4KXtyZXR1cm4geC5uYW1lPT09bjt9KTsgaWYocGwpe2FwcGx5Q29uZmlnKHBsKTtydW5Db25maWcocGwpO3dpbmRvdy5zY3JvbGxUbyh7dG9wOjAsYmVoYXZpb3I6J3Ntb290aCd9KTt9IH07IH0pOwogIGJveC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1kZWxdJykuZm9yRWFjaChmdW5jdGlvbihiKXsgYi5vbmNsaWNrPWZ1bmN0aW9uKCl7IHZhciBuPWRlY29kZVVSSUNvbXBvbmVudChiLmdldEF0dHJpYnV0ZSgnZGF0YS1kZWwnKSk7IGZldGNoKCcvcGlwZWxpbmVzL2RlbGV0ZScse21ldGhvZDonUE9TVCcsaGVhZGVyczp7J0NvbnRlbnQtVHlwZSc6J2FwcGxpY2F0aW9uL2pzb24nfSxib2R5OkpTT04uc3RyaW5naWZ5KHtuYW1lOm4sYWRtaW5QYXNzd29yZDpnZXRBZG1pbigpfSl9KS50aGVuKGZ1bmN0aW9uKHIpe3JldHVybiByLmpzb24oKTt9KS50aGVuKGZ1bmN0aW9uKGQpeyBpZihkLmVycm9yKXthbGVydChkLmVycm9yKTtyZXR1cm47fSBsb2FkUGlwZXMoKTsgfSk7IH07IH0pOwp9CmZ1bmN0aW9uIGxvYWRQaXBlcygpeyBmZXRjaCgnL3BpcGVsaW5lcycpLnRoZW4oZnVuY3Rpb24ocil7cmV0dXJuIHIuanNvbigpO30pLnRoZW4oZnVuY3Rpb24oZCl7IHdpbmRvdy5fcGlwZXM9ZC5waXBlbGluZXN8fFtdOyByZW5kZXJQaXBlcyh3aW5kb3cuX3BpcGVzKTsgfSkuY2F0Y2goZnVuY3Rpb24oKXt9KTsgfQokKCdzYXZlJykub25jbGljaz1mdW5jdGlvbigpewogIHZhciBjZmc9Y3VycmVudENvbmZpZygpOwogIGZldGNoKCcvcGlwZWxpbmVzL3NhdmUnLHttZXRob2Q6J1BPU1QnLGhlYWRlcnM6eydDb250ZW50LVR5cGUnOidhcHBsaWNhdGlvbi9qc29uJ30sYm9keTpKU09OLnN0cmluZ2lmeSh7cGlwZWxpbmU6Y2ZnLGFkbWluUGFzc3dvcmQ6Z2V0QWRtaW4oKX0pfSkudGhlbihmdW5jdGlvbihyKXtyZXR1cm4gci5qc29uKCk7fSkudGhlbihmdW5jdGlvbihkKXsgaWYoZC5lcnJvcil7YWxlcnQoZC5lcnJvcik7cmV0dXJuO30gbG9hZFBpcGVzKCk7IH0pOwp9Owpsb2FkUGlwZXMoKTsKCi8vIC0tLS0gYmFja3VwcyAtLS0tCiQoJ2xvYWRCYWNrdXBzJykub25jbGljaz1mdW5jdGlvbigpewogICQoJ2JhY2t1cHMnKS50ZXh0Q29udGVudD0nTG9hZGluZ+KApic7CiAgZmV0Y2goJy9iYWNrdXBzP2FkbWluPScrZW5jb2RlVVJJQ29tcG9uZW50KGdldEFkbWluKCkpKS50aGVuKGZ1bmN0aW9uKHIpe3JldHVybiByLmpzb24oKTt9KS50aGVuKGZ1bmN0aW9uKGQpewogICAgaWYoZC5lcnJvcil7ICQoJ2JhY2t1cHMnKS50ZXh0Q29udGVudD0nRXJyb3I6ICcrZC5lcnJvcjsgcmV0dXJuOyB9CiAgICBpZighZC5iYWNrdXBzfHwhZC5iYWNrdXBzLmxlbmd0aCl7ICQoJ2JhY2t1cHMnKS50ZXh0Q29udGVudD0nTm8gYmFja3VwcyB5ZXQg4oCUIHRoZSBkYWlseSBzY2hlZHVsZSB3cml0ZXMgdGhlbSBoZXJlLic7IHJldHVybjsgfQogICAgJCgnYmFja3VwcycpLmlubmVySFRNTD1kLmJhY2t1cHMubWFwKGZ1bmN0aW9uKGIpeyByZXR1cm4gJzxkaXYgc3R5bGU9InBhZGRpbmc6NnB4IDA7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSkiPjxhIGNsYXNzPSJsaW5rIiBocmVmPSInK2IudXJsKyciPicrYi5uYW1lKyc8L2E+IDxzcGFuIGNsYXNzPSJtdXQiPignK01hdGgucm91bmQoKGIuc2l6ZXx8MCkvMTAyNCkrJyBLQik8L3NwYW4+PC9kaXY+JzsgfSkuam9pbignJyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7ICQoJ2JhY2t1cHMnKS50ZXh0Q29udGVudD0nRXJyb3I6ICcrZS5tZXNzYWdlOyB9KTsKfTsKCi8vIC0tLS0gbWFuYWdlIGNsaWVudHMgLS0tLQokKCdjX2FkZCcpLm9uY2xpY2s9ZnVuY3Rpb24oKXsKICB2YXIgYm9keT17IG5hbWU6JCgnY19uYW1lJykudmFsdWUudHJpbSgpLCBzaG9waWZ5U3RvcmU6JCgnY19zdG9yZScpLnZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eaHR0cHM/OlwvXC8vLCcnKSwgc2hvcGlmeUNsaWVudElkOiQoJ2NfY2lkJykudmFsdWUudHJpbSgpLCBzaG9waWZ5Q2xpZW50U2VjcmV0OiQoJ2Nfc2VjcmV0JykudmFsdWUsIGdvb2dsZUFkc0N1c3RvbWVySWQ6JCgnY19nYWRzJykudmFsdWUudHJpbSgpLCBhZG1pblBhc3N3b3JkOiQoJ2NfYWRtaW4nKS52YWx1ZSB9OwogIGlmKCFib2R5Lm5hbWV8fCFib2R5LnNob3BpZnlTdG9yZXx8IWJvZHkuc2hvcGlmeUNsaWVudElkfHwhYm9keS5zaG9waWZ5Q2xpZW50U2VjcmV0KXsgJCgnY19tc2cnKS50ZXh0Q29udGVudD0nRmlsbCBpbiBuYW1lLCBzdG9yZSwgQ2xpZW50IElEIGFuZCBTZWNyZXQuJzsgcmV0dXJuOyB9CiAgJCgnY19tc2cnKS50ZXh0Q29udGVudD0nQWRkaW5n4oCmJzsKICBmZXRjaCgnL2NsaWVudHMvYWRkJyx7bWV0aG9kOidQT1NUJyxoZWFkZXJzOnsnQ29udGVudC1UeXBlJzonYXBwbGljYXRpb24vanNvbid9LGJvZHk6SlNPTi5zdHJpbmdpZnkoYm9keSl9KS50aGVuKGZ1bmN0aW9uKHIpe3JldHVybiByLmpzb24oKTt9KS50aGVuKGZ1bmN0aW9uKGQpewogICAgaWYoZC5lcnJvcil7ICQoJ2NfbXNnJykudGV4dENvbnRlbnQ9J0Vycm9yOiAnK2QuZXJyb3I7IHJldHVybjsgfQogICAgJCgnY19tc2cnKS50ZXh0Q29udGVudD0n4pyTIFNhdmVkLiBDbGllbnRzIG5vdzogJysoZC5jbGllbnRzfHxbXSkuam9pbignLCAnKSsnLiAnKyhkLmRlcGxveVRyaWdnZXJlZD8nUmVkZXBsb3lpbmcgKH40MHMpJzonTm93IHJlZGVwbG95IGluIFZlcmNlbCcpKycg4oCUIHRoZW4gcmVmcmVzaC4nOwogICAgJCgnY19uYW1lJykudmFsdWU9Jyc7JCgnY19zdG9yZScpLnZhbHVlPScnOyQoJ2NfY2lkJykudmFsdWU9Jyc7JCgnY19zZWNyZXQnKS52YWx1ZT0nJzskKCdjX2dhZHMnKS52YWx1ZT0nJzsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgJCgnY19tc2cnKS50ZXh0Q29udGVudD0nRXJyb3I6ICcrZS5tZXNzYWdlOyB9KTsKfTsKPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo=", "base64").toString("utf8");

// ---- admin / Vercel API config ----
const ADMIN = process.env.ADMIN_PASSWORD || '';
const VTOKEN = process.env.VERCEL_TOKEN || '';
const VTEAM = process.env.VERCEL_TEAM_ID || 'team_nrWecjRIXWc07D9x1yc86rc8';
const VPROJECT = process.env.VERCEL_PROJECT_NAME || 'digistex-backend';
const VHOOK = process.env.VERCEL_DEPLOY_HOOK || '';

function json(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); }
function html(res, code, body) { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8' }); res.end(body); }
function ist(iso) { return S.toOffset(iso, cfg.timezoneOffset); }
function readBody(req) { return new Promise(function (resolve) { var d=''; req.on('data', function(c){d+=c;}); req.on('end', function(){ try{ resolve(d?JSON.parse(d):{}); }catch(e){ resolve({}); } }); }); }
function slug(s){ return String(s||'pipeline').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
function toCsv(rows){ var esc=function(v){ v=String(v==null?'':v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }; return rows.map(function(r){return r.map(esc).join(',');}).join('\n'); }

function currentClients() { try { var p = JSON.parse(process.env.CLIENTS_JSON || '[]'); return Array.isArray(p) ? p : (p && typeof p==='object' ? [p] : []); } catch(e){ return []; } }

// ---- Vercel API (update CLIENTS_JSON + redeploy) ----
async function vFetch(path, opts){
  var url='https://api.vercel.com'+path+(path.indexOf('?')>-1?'&':'?')+'teamId='+encodeURIComponent(VTEAM);
  var o=opts||{}; o.headers=Object.assign({Authorization:'Bearer '+VTOKEN}, o.headers||{});
  var r=await fetch(url,o); var t=await r.text();
  if(!r.ok) throw new Error('Vercel API '+r.status+': '+t.slice(0,200));
  return t?JSON.parse(t):{};
}
async function updateClientsEnv(value){
  var proj=await vFetch('/v9/projects/'+encodeURIComponent(VPROJECT)); var pid=proj.id;
  var envs=await vFetch('/v9/projects/'+pid+'/env');
  var cj=(envs.envs||[]).find(function(e){return e.key==='CLIENTS_JSON';});
  var payload={value:value,target:['production','preview']};
  if(cj){ await vFetch('/v9/projects/'+pid+'/env/'+cj.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); }
  else { await vFetch('/v10/projects/'+pid+'/env',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({key:'CLIENTS_JSON',type:'encrypted'},payload))}); }
}
async function triggerDeploy(){ if(!VHOOK) return false; try{ var r=await fetch(VHOOK,{method:'POST'}); return r.ok; }catch(e){ return false; } }

// ---- Vercel Blob (pipelines store + backups) ----
function blob(){ return require('@vercel/blob'); }
async function readPipelines(){
  try { var l=await blob().list({prefix:'pipelines.json'}); var b=(l.blobs||[]).find(function(x){return x.pathname==='pipelines.json';}); if(!b) return []; var r=await fetch(b.url); return await r.json(); }
  catch(e){ return []; }
}
async function writePipelines(arr){ await blob().put('pipelines.json', JSON.stringify(arr), {access:'public', addRandomSuffix:false, allowOverwrite:true, contentType:'application/json'}); }
async function saveBackup(name, csvText){ var res=await blob().put('backups/'+name, csvText, {access:'public', addRandomSuffix:true, contentType:'text/csv'}); return res.url; }
async function listBackups(){ var l=await blob().list({prefix:'backups/'}); return (l.blobs||[]).map(function(b){return {name:b.pathname.replace('backups/',''), url:b.url, size:b.size, at:b.uploadedAt};}).sort(function(a,b){return a.at<b.at?1:-1;}); }

function isDue(pl, now){
  var f=(pl.frequency||'off').toLowerCase();
  if(f==='daily') return true;
  if(f==='weekly'){ var d=new Date(now.getTime()+5.5*3600*1000); return d.getUTCDay()===1; } // Monday IST
  return false;
}
function buildGadsCsv(pl, data){
  var bare=function(t){return String(t).replace(/\s*[+-]\d\d:?\d\d$/,'');};
  var params=['Parameters:TimeZone=Asia/Kolkata'];
  if(pl.type==='contacts'){
    var head=['Conversion Name','Conversion Time','Email','Phone Number'];
    var rows=(data.rows||[]).map(function(r){return [pl.conv, bare(r[5]), r[0], r[2]];});
    return toCsv([params, head].concat(rows));
  }
  var head=['Google Click ID','Conversion Name','Conversion Time','Conversion Value','Conversion Currency','Email'];
  var rows=(data.conversions||[]).map(function(c){return [c.gclid, pl.conv, bare(c.time), c.value, c.currency, c.email];});
  return toCsv([params, head].concat(rows));
}

async function doPull(client, token, type, days) {
  if (type === 'contacts') {
    const cs = await S.fetchCustomers(client, token, cfg, days);
    const columns = ['Email','Name','Phone','Orders','Total spent','Created (IST)'];
    const rows = cs.map(c => [c.email||'', ((c.first_name||'')+' '+(c.last_name||'')).trim(), c.phone||'', c.orders_count||0, c.total_spent||'0', ist(c.created_at)]);
    return { type, days, client: client.name, count: rows.length, columns, rows };
  }
  const fin = type === 'prepaid' ? 'paid' : null;
  const orders = await S.fetchOrders(client, token, cfg, days, fin);
  const columns = ['Order','Email','Created (IST)','Value','Currency','Payment','gclid'];
  const rows = []; const conversions = [];
  for (const o of orders) {
    const g = S.gclidOf(o);
    rows.push([o.name||'', o.email||'', ist(o.created_at), o.total_price, o.currency, o.financial_status||'', g||'']);
    if (g) conversions.push({ gclid:g, time:ist(o.created_at), value:o.total_price, currency:o.currency, email:o.email||'' });
  }
  return { type, days, client: client.name, count: rows.length, columns, rows, gclidCount: conversions.length, conversions };
}

http.createServer(async (req, res) => {
  const u = req.url || '/'; const path = u.split('?')[0];
  const q = new URLSearchParams(u.split('?')[1] || '');
  try {
    if (path === '/health' || path === '/api/health') return json(res, 200, { ok:true, time:new Date().toISOString() });
    if (path === '/clients' || path === '/api/clients') return json(res, 200, { clients: cfg.clients.map(c => ({ name:c.name, store:c.shopifyStore })) });
    if (path === '/diag' || path === '/api/diag') {
      const out=[];
      for (const c of cfg.clients) {
        try { const t=await S.getAccessToken(c); const o=await S.fetchOrders(c,t,cfg,7,null); out.push({ client:c.name, store:c.shopifyStore, tokenMinted:true, orders:o.length, gclidRows:o.filter(S.gclidOf).length }); }
        catch(e){ out.push({ client:c.name, store:c.shopifyStore, tokenMinted:false, error:e.message }); }
      }
      return json(res, 200, { clientsConfigured: cfg.clients.length, clients: out });
    }
    if (path === '/pull' || path === '/api/pull') {
      const type=q.get('type')||'orders'; const days=Math.min(parseInt(q.get('days')||'7',10)||7,120);
      const cname=q.get('client'); const client=cname?cfg.clients.find(c=>c.name===cname):cfg.clients[0];
      if(!client) return json(res,400,{error:'No store configured. Add a client below.'});
      const token=await S.getAccessToken(client);
      return json(res, 200, await doPull(client, token, type, days));
    }
    if (path === '/export' || path === '/export.csv' || path === '/api/export') {
      // Live Google Ads offline-conversion feed for Google Ads Scheduled Uploads (HTTPS source).
      if (process.env.EXPORT_KEY && q.get('key') !== process.env.EXPORT_KEY) { res.writeHead(401); return res.end('unauthorized'); }
      const type = q.get('type') || 'orders';
      const days = Math.min(parseInt(q.get('days') || '7', 10) || 7, 120);
      const conv = q.get('conv') || 'CRM-PURCHASE';
      const cname = q.get('client');
      const client = cname ? cfg.clients.find(c => c.name === cname) : cfg.clients[0];
      if (!client) { res.writeHead(400); return res.end('no client configured'); }
      const token = await S.getAccessToken(client);
      const data = await doPull(client, token, type, days);
      // Google Ads: declare timezone once at file level, give bare timestamps (no per-row offset).
      const bare = function (t) { return String(t).replace(/\s*[+-]\d\d:?\d\d$/, ''); };
      const params = ['Parameters:TimeZone=Asia/Kolkata'];
      var head, rows;
      if (type === 'contacts') {
        head = ['Conversion Name', 'Conversion Time', 'Email', 'Phone Number'];
        rows = (data.rows || []).map(function (r) { return [conv, bare(r[5]), r[0], r[2]]; });
      } else {
        head = ['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency', 'Email'];
        rows = (data.conversions || []).map(function (c) { return [c.gclid, conv, bare(c.time), c.value, c.currency, c.email]; });
      }
      res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'cache-control': 'no-store, max-age=0' });
      return res.end(toCsv([params, head].concat(rows)));
    }
    if (path === '/pipelines' && req.method === 'GET') return json(res, 200, { pipelines: await readPipelines() });
    if (path === '/pipelines/save' && req.method === 'POST') {
      const b=await readBody(req);
      if(!ADMIN || b.adminPassword!==ADMIN) return json(res,401,{error:'Wrong admin password.'});
      const p=b.pipeline; if(!p||!p.name) return json(res,400,{error:'pipeline.name required'});
      let list=(await readPipelines()).filter(function(x){return x.name!==p.name;});
      list.push({ name:p.name, client:p.client, type:p.type||'orders', days:parseInt(p.days,10)||7, conv:p.conv||'CRM-PURCHASE', frequency:p.frequency||'off' });
      await writePipelines(list);
      return json(res, 200, { ok:true, pipelines:list });
    }
    if (path === '/pipelines/delete' && req.method === 'POST') {
      const b=await readBody(req);
      if(!ADMIN || b.adminPassword!==ADMIN) return json(res,401,{error:'Wrong admin password.'});
      let list=(await readPipelines()).filter(function(x){return x.name!==b.name;});
      await writePipelines(list);
      return json(res, 200, { ok:true, pipelines:list });
    }
    if (path === '/backups' && req.method === 'GET') {
      if(!ADMIN || q.get('admin')!==ADMIN) return json(res,401,{error:'admin password required'});
      return json(res, 200, { backups: await listBackups() });
    }
    if (path === '/clients/add' && req.method === 'POST') {
      const b=await readBody(req);
      if(!ADMIN) return json(res,400,{error:'ADMIN_PASSWORD is not set on the server.'});
      if(b.adminPassword!==ADMIN) return json(res,401,{error:'Wrong admin password.'});
      if(!VTOKEN) return json(res,400,{error:'VERCEL_TOKEN is not set — cannot update the env var.'});
      if(!b.name||!b.shopifyStore||!b.shopifyClientId||!b.shopifyClientSecret) return json(res,400,{error:'name, store, Client ID and Secret are required.'});
      const nc={ name:b.name, shopifyStore:b.shopifyStore, shopifyClientId:b.shopifyClientId, shopifyClientSecret:b.shopifyClientSecret, googleAdsCustomerId:b.googleAdsCustomerId||'', conversionActionId:'', enabled:true };
      let list=currentClients().filter(function(c){return c.shopifyStore!==nc.shopifyStore;});
      list.push(nc);
      await updateClientsEnv(JSON.stringify(list));
      const deployed=await triggerDeploy();
      return json(res, 200, { ok:true, clients:list.map(function(c){return c.name;}), deployTriggered:deployed });
    }
    if (path === '/api/cron' || path === '/cron') {
      if (process.env.CRON_SECRET && (req.headers['authorization']||'') !== ('Bearer '+process.env.CRON_SECRET)) return json(res,401,{error:'unauthorized'});
      const now=new Date(); const pls=await readPipelines(); const results=[];
      for (const pl of pls) {
        if(!isDue(pl,now)){ results.push({ pipeline:pl.name, skipped:true }); continue; }
        try {
          const client=cfg.clients.find(c=>c.name===pl.client)||cfg.clients[0];
          if(!client){ results.push({ pipeline:pl.name, error:'no client' }); continue; }
          const token=await S.getAccessToken(client);
          const data=await doPull(client, token, pl.type||'orders', parseInt(pl.days,10)||1);
          const date=ist(now.toISOString()).slice(0,10);
          const url=await saveBackup(slug(pl.name)+'_'+(pl.type||'orders')+'_'+date+'.csv', buildGadsCsv(pl, data));
          results.push({ pipeline:pl.name, rows:(pl.type==='contacts'?data.count:(data.gclidCount||0)), url });
        } catch(e){ results.push({ pipeline:pl.name, error:e.message }); }
      }
      return json(res, 200, { ranAt:now.toISOString(), results });
    }
    return html(res, 200, UI_HTML);
  } catch (e) { return json(res, 500, { error: e.message }); }
}).listen(PORT, () => console.log('listening on ' + PORT));
