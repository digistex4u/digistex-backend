'use strict';
const http = require('http');
const cfg = require('./config');
const S = require('./shopify');
const PORT = process.env.PORT || 3000;
const UI_HTML = Buffer.from("PCFkb2N0eXBlIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9InV0Zi04Ij4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xIj4KPHRpdGxlPkRpZ2lzdGV4IOKAlCBQaXBlbGluZXM8L3RpdGxlPgo8c3R5bGU+Cjpyb290e2NvbG9yLXNjaGVtZTpsaWdodDstLWluazojMTYxYjI2Oy0tbXV0OiM1YjY0NzI7LS1saW5lOiNlNmU5ZWY7LS1jYXJkOiNmZmY7LS1iZzojZjZmN2Y5OwogIC0tYnJhbmQ6IzJmNmRmNjstLWJyYW5kYmc6I2VhZjFmZjstLWdvb2Q6IzEyN2EzZTstLWdvb2RiZzojZTdmNmVjOy0td2FybmJnOiNmZmY0ZGU7LS13YXJuOiM4YTVhMDA7fQoqe2JveC1zaXppbmc6Ym9yZGVyLWJveH0KYm9keXttYXJnaW46MDtiYWNrZ3JvdW5kOnZhcigtLWJnKTtjb2xvcjp2YXIoLS1pbmspO2ZvbnQ6MTRweC8xLjUgLWFwcGxlLXN5c3RlbSxTZWdvZSBVSSxSb2JvdG8sSGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWZ9Ci53cmFwe21heC13aWR0aDo5NjBweDttYXJnaW46MCBhdXRvO3BhZGRpbmc6MjJweCAxOHB4IDYwcHh9Cmgxe2ZvbnQtc2l6ZToyMHB4O21hcmdpbjowIDAgMnB4fQouc3Vie2NvbG9yOnZhcigtLW11dCk7Zm9udC1zaXplOjEzcHg7bWFyZ2luLWJvdHRvbToyMHB4fQouY2FyZHtiYWNrZ3JvdW5kOnZhcigtLWNhcmQpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czoxNHB4O3BhZGRpbmc6MThweDttYXJnaW4tYm90dG9tOjE4cHh9Ci5jYXJkIGgye2ZvbnQtc2l6ZToxNHB4O21hcmdpbjowIDAgMTRweDtsZXR0ZXItc3BhY2luZzouMDJlbX0KbGFiZWx7ZGlzcGxheTpibG9jaztmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1tdXQpO3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtsZXR0ZXItc3BhY2luZzouMDRlbTttYXJnaW4tYm90dG9tOjZweH0KLnJvd3tkaXNwbGF5OmZsZXg7Z2FwOjE0cHg7ZmxleC13cmFwOndyYXB9Ci5yb3c+ZGl2e2ZsZXg6MTttaW4td2lkdGg6MTcwcHg7bWFyZ2luLWJvdHRvbToxMnB4fQpzZWxlY3QsaW5wdXR7d2lkdGg6MTAwJTtwYWRkaW5nOjlweCAxMXB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czo5cHg7YmFja2dyb3VuZDojZmZmO2ZvbnQ6aW5oZXJpdDtjb2xvcjp2YXIoLS1pbmspfQouc2Vne2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwfQouc2VnIGJ1dHRvbntmbGV4OjE7bWluLXdpZHRoOjEyMHB4O3BhZGRpbmc6MTBweDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6OXB4O2JhY2tncm91bmQ6I2ZmZjtjdXJzb3I6cG9pbnRlcjtmb250OmluaGVyaXQ7Y29sb3I6dmFyKC0taW5rKX0KLnNlZyBidXR0b24ub257Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKTtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kYmcpO2NvbG9yOnZhcigtLWJyYW5kKTtmb250LXdlaWdodDo2MDB9Ci5hY3Rpb25ze2Rpc3BsYXk6ZmxleDtnYXA6MTBweDttYXJnaW4tdG9wOjZweDtmbGV4LXdyYXA6d3JhcH0KYnV0dG9uLnByaXtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWJyYW5kKTtjb2xvcjojZmZmO3BhZGRpbmc6MTBweCAxNnB4O2JvcmRlci1yYWRpdXM6OXB4O2N1cnNvcjpwb2ludGVyO2ZvbnQ6aW5oZXJpdDtmb250LXdlaWdodDo2MDB9CmJ1dHRvbi5zZWN7YmFja2dyb3VuZDojZmZmO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Y29sb3I6dmFyKC0taW5rKTtwYWRkaW5nOjEwcHggMTZweDtib3JkZXItcmFkaXVzOjlweDtjdXJzb3I6cG9pbnRlcjtmb250OmluaGVyaXR9CmJ1dHRvbjpkaXNhYmxlZHtvcGFjaXR5Oi41O2N1cnNvcjpkZWZhdWx0fQouaGlkZXtkaXNwbGF5Om5vbmV9Ci5zdW1tYXJ5e2JhY2tncm91bmQ6dmFyKC0tZ29vZGJnKTtjb2xvcjp2YXIoLS1nb29kKTtib3JkZXItcmFkaXVzOjlweDtwYWRkaW5nOjEwcHggMTJweDtmb250LXdlaWdodDo2MDA7bWFyZ2luLWJvdHRvbToxMnB4O2ZvbnQtc2l6ZToxM3B4fQouc3VtbWFyeS5lcnJ7YmFja2dyb3VuZDojZmRlY2VhO2NvbG9yOiNiMzI2MWV9CnRhYmxle3dpZHRoOjEwMCU7Ym9yZGVyLWNvbGxhcHNlOmNvbGxhcHNlO2ZvbnQtc2l6ZToxMi41cHh9CnRoLHRke3BhZGRpbmc6OHB4IDEwcHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSk7dGV4dC1hbGlnbjpsZWZ0O3doaXRlLXNwYWNlOm5vd3JhcDtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczttYXgtd2lkdGg6MjAwcHh9CnRoe2NvbG9yOnZhcigtLW11dCk7Zm9udC1zaXplOjExcHg7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi4wM2VtO3Bvc2l0aW9uOnN0aWNreTt0b3A6MDtiYWNrZ3JvdW5kOiNmZmZ9Ci50YWJsZXdyYXB7b3ZlcmZsb3c6YXV0bzttYXgtaGVpZ2h0OjM0MHB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czoxMHB4fQouZGx7ZGlzcGxheTpmbGV4O2dhcDoxMHB4O21hcmdpbi10b3A6MTJweDtmbGV4LXdyYXA6d3JhcH0KLnBpcGV7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDtwYWRkaW5nOjEycHg7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOjEwcHg7bWFyZ2luLWJvdHRvbTo4cHg7ZmxleC13cmFwOndyYXB9Ci5waXBlIC5ubXtmb250LXdlaWdodDo2MDB9LnBpcGUgLm1ldGF7Y29sb3I6dmFyKC0tbXV0KTtmb250LXNpemU6MTJweH0KLnBpcGUgLnNwe2ZsZXg6MX0KLm11dHtjb2xvcjp2YXIoLS1tdXQpO2ZvbnQtc2l6ZToxMnB4fQoudGFne2Rpc3BsYXk6aW5saW5lLWJsb2NrO2JhY2tncm91bmQ6I2VlZjFmNjtjb2xvcjojNTU2MDZmO2JvcmRlci1yYWRpdXM6MjBweDtwYWRkaW5nOjFweCA4cHg7Zm9udC1zaXplOjExcHg7bWFyZ2luLWxlZnQ6NnB4fQoudGFnLmZyZXF7YmFja2dyb3VuZDp2YXIoLS1nb29kYmcpO2NvbG9yOnZhcigtLWdvb2QpfQphLmxpbmt7Y29sb3I6dmFyKC0tYnJhbmQpO3RleHQtZGVjb3JhdGlvbjpub25lfQo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5Pgo8ZGl2IGNsYXNzPSJ3cmFwIj4KICA8aDE+RGlnaXN0ZXgg4oCUIFNob3BpZnkg4oaSIEdvb2dsZSBBZHMgUGlwZWxpbmVzPC9oMT4KICA8ZGl2IGNsYXNzPSJzdWIiPkRlZmluZSB3aGF0IHRvIHB1bGwsIG92ZXIgd2hhdCB3aW5kb3csIHRoZSBjb252ZXJzaW9uIGFjdGlvbiwgYW5kIGhvdyBvZnRlbi4gUnVuIG9uIGRlbWFuZCBvciBzY2hlZHVsZSBpdC48L2Rpdj4KCiAgPGRpdiBjbGFzcz0iY2FyZCI+CiAgICA8aDI+QlVJTEQgQSBQVUxMPC9oMj4KICAgIDxkaXYgY2xhc3M9InJvdyI+CiAgICAgIDxkaXY+PGxhYmVsPlBpcGVsaW5lIG5hbWU8L2xhYmVsPjxpbnB1dCBpZD0icG5hbWUiIHBsYWNlaG9sZGVyPSJlLmcuIFByYW1vZ2ggcHJlcGFpZCDihpIgQ1JNLVBVUkNIQVNFIj48L2Rpdj4KICAgICAgPGRpdj48bGFiZWw+U3RvcmU8L2xhYmVsPjxzZWxlY3QgaWQ9ImNsaWVudCI+PC9zZWxlY3Q+PC9kaXY+CiAgICA8L2Rpdj4KICAgIDxsYWJlbD5XaGF0IHRvIHB1bGw8L2xhYmVsPgogICAgPGRpdiBjbGFzcz0ic2VnIiBpZD0idHlwZXNlZyIgc3R5bGU9Im1hcmdpbi1ib3R0b206MTRweCI+CiAgICAgIDxidXR0b24gZGF0YS10eXBlPSJvcmRlcnMiIGNsYXNzPSJvbiI+QWxsIG9yZGVyczwvYnV0dG9uPgogICAgICA8YnV0dG9uIGRhdGEtdHlwZT0icHJlcGFpZCI+UHJlcGFpZCBvcmRlcnMgb25seTwvYnV0dG9uPgogICAgICA8YnV0dG9uIGRhdGEtdHlwZT0iY29udGFjdHMiPkNvbnRhY3RzPC9idXR0b24+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9InJvdyI+CiAgICAgIDxkaXY+CiAgICAgICAgPGxhYmVsPlRpbWUgcGVyaW9kPC9sYWJlbD4KICAgICAgICA8c2VsZWN0IGlkPSJkYXlzIj48b3B0aW9uIHZhbHVlPSI3Ij5MYXN0IDcgZGF5czwvb3B0aW9uPjxvcHRpb24gdmFsdWU9IjE0Ij5MYXN0IDE0IGRheXM8L29wdGlvbj48b3B0aW9uIHZhbHVlPSIzMCIgc2VsZWN0ZWQ+TGFzdCAzMCBkYXlzPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0iOTAiPkxhc3QgOTAgZGF5czwvb3B0aW9uPjwvc2VsZWN0PgogICAgICA8L2Rpdj4KICAgICAgPGRpdj4KICAgICAgICA8bGFiZWw+RnJlcXVlbmN5IChzY2hlZHVsZSk8L2xhYmVsPgogICAgICAgIDxzZWxlY3QgaWQ9ImZyZXEiPjxvcHRpb24gdmFsdWU9Im9mZiIgc2VsZWN0ZWQ+T2ZmIChvbiBkZW1hbmQpPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0iZGFpbHkiPkRhaWx5PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0id2Vla2x5Ij5XZWVrbHkgKE1vbik8L29wdGlvbj48L3NlbGVjdD4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgaWQ9ImNvbnZ3cmFwIj48bGFiZWwgaWQ9ImNvbnZsYWJlbCI+R29vZ2xlIEFkcyBjb252ZXJzaW9uIGFjdGlvbjwvbGFiZWw+PGlucHV0IGlkPSJjb252IiB2YWx1ZT0iQ1JNLVBVUkNIQVNFIj48L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0iYWN0aW9ucyI+CiAgICAgIDxidXR0b24gY2xhc3M9InByaSIgaWQ9InJ1biI+UnVuIG5vdzwvYnV0dG9uPgogICAgICA8YnV0dG9uIGNsYXNzPSJzZWMiIGlkPSJzYXZlIj5TYXZlIC8gc2NoZWR1bGUgcGlwZWxpbmU8L2J1dHRvbj4KICAgICAgPGJ1dHRvbiBjbGFzcz0ic2VjIiBpZD0iY29weUZlZWQiPkNvcHkgZmVlZCBVUkw8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8ZGl2IGNsYXNzPSJjYXJkIGhpZGUiIGlkPSJyZXN1bHRzIj4KICAgIDxoMj5SRVNVTFQ8L2gyPgogICAgPGRpdiBjbGFzcz0ic3VtbWFyeSIgaWQ9InN1bW1hcnkiPjwvZGl2PgogICAgPGRpdiBjbGFzcz0idGFibGV3cmFwIj48dGFibGUgaWQ9InRibCI+PHRoZWFkPjwvdGhlYWQ+PHRib2R5PjwvdGJvZHk+PC90YWJsZT48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImRsIj4KICAgICAgPGJ1dHRvbiBjbGFzcz0ic2VjIiBpZD0iZGxEYXRhIj5Eb3dubG9hZCBkYXRhIChDU1YpPC9idXR0b24+CiAgICAgIDxidXR0b24gY2xhc3M9InByaSIgaWQ9ImRsR2FkcyI+RG93bmxvYWQgR29vZ2xlIEFkcyBDU1Y8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8ZGl2IGNsYXNzPSJjYXJkIj4KICAgIDxoMj5TQVZFRCBQSVBFTElORVM8L2gyPgogICAgPGRpdiBpZD0icGlwZXMiPjwvZGl2PgogICAgPGRpdiBjbGFzcz0ibXV0IiBpZD0ibm9waXBlcyI+Tm8gcGlwZWxpbmVzIHNhdmVkIHlldC4gQ29uZmlndXJlIGEgcHVsbCBhYm92ZSBhbmQgY2xpY2sg4oCcU2F2ZSAvIHNjaGVkdWxlIHBpcGVsaW5l4oCdLjwvZGl2PgogIDwvZGl2PgoKICA8ZGl2IGNsYXNzPSJjYXJkIj4KICAgIDxoMj5CQUNLVVBTICZuYnNwOzxzcGFuIGNsYXNzPSJtdXQiIHN0eWxlPSJ0ZXh0LXRyYW5zZm9ybTpub25lO2xldHRlci1zcGFjaW5nOjAiPuKAlCBmaWxlcyB3cml0dGVuIGJ5IHRoZSBkYWlseSBzY2hlZHVsZTwvc3Bhbj48L2gyPgogICAgPGRpdiBjbGFzcz0iYWN0aW9ucyI+PGJ1dHRvbiBjbGFzcz0ic2VjIiBpZD0ibG9hZEJhY2t1cHMiPkxvYWQgYmFja3VwczwvYnV0dG9uPjwvZGl2PgogICAgPGRpdiBpZD0iYmFja3VwcyIgY2xhc3M9Im11dCIgc3R5bGU9Im1hcmdpbi10b3A6MTBweCI+PC9kaXY+CiAgPC9kaXY+CgogIDxkaXYgY2xhc3M9ImNhcmQiPgogICAgPGgyPk1BTkFHRSBDTElFTlRTICZuYnNwOzxzcGFuIGNsYXNzPSJtdXQiIHN0eWxlPSJ0ZXh0LXRyYW5zZm9ybTpub25lO2xldHRlci1zcGFjaW5nOjAiPuKAlCBhZGRzIGEgYnJhbmQgdG8gQ0xJRU5UU19KU09OICZhbXA7IHJlZGVwbG95czwvc3Bhbj48L2gyPgogICAgPGRpdiBjbGFzcz0icm93Ij4KICAgICAgPGRpdj48bGFiZWw+Q2xpZW50IG5hbWU8L2xhYmVsPjxpbnB1dCBpZD0iY19uYW1lIiBwbGFjZWhvbGRlcj0iZS5nLiBBZW5hayI+PC9kaXY+CiAgICAgIDxkaXY+PGxhYmVsPlNob3BpZnkgc3RvcmUgZG9tYWluPC9sYWJlbD48aW5wdXQgaWQ9ImNfc3RvcmUiIHBsYWNlaG9sZGVyPSJhZW5hay5teXNob3BpZnkuY29tIj48L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0icm93Ij4KICAgICAgPGRpdj48bGFiZWw+U2hvcGlmeSBDbGllbnQgSUQ8L2xhYmVsPjxpbnB1dCBpZD0iY19jaWQiPjwvZGl2PgogICAgICA8ZGl2PjxsYWJlbD5TaG9waWZ5IENsaWVudCBTZWNyZXQ8L2xhYmVsPjxpbnB1dCBpZD0iY19zZWNyZXQiIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0icm93Ij4KICAgICAgPGRpdj48bGFiZWw+R29vZ2xlIEFkcyBDdXN0b21lciBJRCAob3B0aW9uYWwpPC9sYWJlbD48aW5wdXQgaWQ9ImNfZ2FkcyIgcGxhY2Vob2xkZXI9ImRpZ2l0cyBvbmx5Ij48L2Rpdj4KICAgICAgPGRpdj48bGFiZWw+Q2xpZW50IGVtYWlsIChkYWlseSByZXBvcnQgQ0MpPC9sYWJlbD48aW5wdXQgaWQ9ImNfZW1haWwiIHBsYWNlaG9sZGVyPSJjbGllbnRAYnJhbmQuY29tIj48L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0icm93Ij4KICAgICAgPGRpdj48bGFiZWw+QWRtaW4gcGFzc3dvcmQ8L2xhYmVsPjxpbnB1dCBpZD0iY19hZG1pbiIgdHlwZT0icGFzc3dvcmQiIHBsYWNlaG9sZGVyPSJBRE1JTl9QQVNTV09SRCI+PC9kaXY+CiAgICAgIDxkaXY+PC9kaXY+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImFjdGlvbnMiPjxidXR0b24gY2xhc3M9InByaSIgaWQ9ImNfYWRkIj5BZGQgY2xpZW50PC9idXR0b24+PC9kaXY+CiAgICA8ZGl2IGlkPSJjX21zZyIgY2xhc3M9Im11dCIgc3R5bGU9Im1hcmdpbi10b3A6MTBweCI+PC9kaXY+CiAgPC9kaXY+CgogIDxkaXYgY2xhc3M9Im11dCI+QmFja2VuZDogPGEgY2xhc3M9ImxpbmsiIGhyZWY9Ii9kaWFnIj4vZGlhZzwvYT4gwrcgZGFpbHkgc2NoZWR1bGUgcnVucyB+NiBBTSBJU1Qgwrcga2V5cyBzdG9yZWQgaW4gVmVyY2VsLjwvZGl2Pgo8L2Rpdj4KCjxzY3JpcHQ+CnZhciBzdGF0ZSA9IHsgdHlwZTonb3JkZXJzJywgbGFzdDpudWxsIH07CmZ1bmN0aW9uICQoaWQpeyByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOyB9CmZ1bmN0aW9uIHR5cGVMYWJlbCh0KXsgcmV0dXJuIHQ9PT0nb3JkZXJzJz8nQWxsIG9yZGVycyc6dD09PSdwcmVwYWlkJz8nUHJlcGFpZCBvcmRlcnMgb25seSc6J0NvbnRhY3RzJzsgfQpmdW5jdGlvbiBpc09yZGVyVHlwZSh0KXsgcmV0dXJuIHQ9PT0nb3JkZXJzJ3x8dD09PSdwcmVwYWlkJzsgfQpmdW5jdGlvbiBzbHVnKHMpeyByZXR1cm4gU3RyaW5nKHMpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXowLTldKy9nLCdfJykucmVwbGFjZSgvXl98XyQvZywnJyk7IH0KZnVuY3Rpb24gZ2V0QWRtaW4oKXsgdmFyIGE9bG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FkbWluX3B3Jyk7IGlmKCFhKXsgYT1wcm9tcHQoJ0FkbWluIHBhc3N3b3JkIChBRE1JTl9QQVNTV09SRCk6Jyl8fCcnOyBpZihhKSBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWRtaW5fcHcnLGEpOyB9IHJldHVybiBhOyB9CmZ1bmN0aW9uIGdldEtleSgpeyB2YXIgaz1sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZXhwb3J0X2tleScpOyBpZighayl7IGs9cHJvbXB0KCdGZWVkIGtleSAoRVhQT1JUX0tFWSkg4oCUIGFkZGVkIHRvIHRoZSBHb29nbGUgQWRzIFVSTDonKXx8Jyc7IGlmKGspIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdleHBvcnRfa2V5JyxrKTsgfSByZXR1cm4gazsgfQpmdW5jdGlvbiBmZWVkVXJsKGNmZyl7IHJldHVybiBsb2NhdGlvbi5vcmlnaW4rJy9leHBvcnQ/Y2xpZW50PScrZW5jb2RlVVJJQ29tcG9uZW50KGNmZy5jbGllbnQpKycmdHlwZT0nK2NmZy50eXBlKycmZGF5cz0nK2NmZy5kYXlzKycmY29udj0nK2VuY29kZVVSSUNvbXBvbmVudChjZmcuY29udikrJyZrZXk9JytlbmNvZGVVUklDb21wb25lbnQoZ2V0S2V5KCkpOyB9CmZ1bmN0aW9uIGNvcHlGZWVkKGNmZyl7IHZhciB1cmw9ZmVlZFVybChjZmcpOyBmdW5jdGlvbiBvaygpeyBhbGVydCgnRmVlZCBVUkwgY29waWVkIOKAlCBwYXN0ZSBpdCBpbnRvIEdvb2dsZSBBZHMg4oaSIFVwbG9hZHMg4oaSIFNjaGVkdWxlcyAoSFRUUFMpOlxuXG4nK3VybCk7IH0gaWYobmF2aWdhdG9yLmNsaXBib2FyZCYmbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQpeyBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh1cmwpLnRoZW4ob2ssZnVuY3Rpb24oKXsgcHJvbXB0KCdDb3B5IHRoaXMgZmVlZCBVUkw6Jyx1cmwpOyB9KTsgfSBlbHNlIHsgcHJvbXB0KCdDb3B5IHRoaXMgZmVlZCBVUkw6Jyx1cmwpOyB9IH0KCmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyN0eXBlc2VnIGJ1dHRvbicpLmZvckVhY2goZnVuY3Rpb24oYil7CiAgYi5vbmNsaWNrPWZ1bmN0aW9uKCl7CiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjdHlwZXNlZyBidXR0b24nKS5mb3JFYWNoKGZ1bmN0aW9uKHgpe3guY2xhc3NMaXN0LnJlbW92ZSgnb24nKTt9KTsKICAgIGIuY2xhc3NMaXN0LmFkZCgnb24nKTsgc3RhdGUudHlwZT1iLmdldEF0dHJpYnV0ZSgnZGF0YS10eXBlJyk7CiAgICAkKCdjb252bGFiZWwnKS50ZXh0Q29udGVudD1pc09yZGVyVHlwZShzdGF0ZS50eXBlKT8nR29vZ2xlIEFkcyBjb252ZXJzaW9uIGFjdGlvbic6J0dvb2dsZSBBZHMgY29udmVyc2lvbiBhY3Rpb24gKGxlYWQpJzsKICB9Owp9KTsKCmZldGNoKCcvY2xpZW50cycpLnRoZW4oZnVuY3Rpb24ocil7cmV0dXJuIHIuanNvbigpO30pLnRoZW4oZnVuY3Rpb24oZCl7CiAgdmFyIHNlbD0kKCdjbGllbnQnKTsgKGQuY2xpZW50c3x8W10pLmZvckVhY2goZnVuY3Rpb24oYyl7IHZhciBvPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpOyBvLnZhbHVlPWMubmFtZTsgby50ZXh0Q29udGVudD1jLm5hbWUrJyAoJytjLnN0b3JlKycpJzsgc2VsLmFwcGVuZENoaWxkKG8pOyB9KTsKICBpZighZC5jbGllbnRzfHwhZC5jbGllbnRzLmxlbmd0aCl7IHZhciBvPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpOyBvLnRleHRDb250ZW50PSdObyBzdG9yZSDigJQgYWRkIG9uZSBiZWxvdyc7IHNlbC5hcHBlbmRDaGlsZChvKTsgfQp9KS5jYXRjaChmdW5jdGlvbigpe30pOwoKZnVuY3Rpb24gY3VycmVudENvbmZpZygpewogIHJldHVybiB7IG5hbWU6JCgncG5hbWUnKS52YWx1ZS50cmltKCl8fCgnUHJhbW9naCAnK3R5cGVMYWJlbChzdGF0ZS50eXBlKSksIGNsaWVudDokKCdjbGllbnQnKS52YWx1ZSwKICAgIHR5cGU6c3RhdGUudHlwZSwgZGF5czpwYXJzZUludCgkKCdkYXlzJykudmFsdWUsMTApLCBjb252OiQoJ2NvbnYnKS52YWx1ZS50cmltKCl8fCdDUk0tUFVSQ0hBU0UnLCBmcmVxdWVuY3k6JCgnZnJlcScpLnZhbHVlIH07Cn0KZnVuY3Rpb24gY3N2KHJvd3MpeyB2YXIgZXNjPWZ1bmN0aW9uKHYpe3Y9U3RyaW5nKHY9PW51bGw/Jyc6dik7cmV0dXJuIC9bIixcbl0vLnRlc3Qodik/JyInK3YucmVwbGFjZSgvIi9nLCciIicpKyciJzp2O307IHJldHVybiByb3dzLm1hcChmdW5jdGlvbihyKXtyZXR1cm4gci5tYXAoZXNjKS5qb2luKCcsJyk7fSkuam9pbignXG4nKTsgfQpmdW5jdGlvbiBkb3dubG9hZChuYW1lLHRleHQpeyB2YXIgYj1uZXcgQmxvYihbdGV4dF0se3R5cGU6J3RleHQvY3N2J30pLHU9VVJMLmNyZWF0ZU9iamVjdFVSTChiKSxhPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsgYS5ocmVmPXU7YS5kb3dubG9hZD1uYW1lO2EuY2xpY2soKTsgc2V0VGltZW91dChmdW5jdGlvbigpe1VSTC5yZXZva2VPYmplY3RVUkwodSk7fSwxNTAwKTsgfQpmdW5jdGlvbiBub3JtRW1haWwoZSl7IGU9U3RyaW5nKGV8fCcnKS50cmltKCkudG9Mb3dlckNhc2UoKTsgaWYoIWUpIHJldHVybiAnJzsgdmFyIGF0PWUuaW5kZXhPZignQCcpOyBpZihhdD4tMSl7IHZhciB1c2VyPWUuc2xpY2UoMCxhdCksIGRvbT1lLnNsaWNlKGF0KzEpOyBpZihkb209PT0nZ21haWwuY29tJ3x8ZG9tPT09J2dvb2dsZW1haWwuY29tJyl7IHVzZXI9dXNlci5zcGxpdCgnKycpWzBdLnJlcGxhY2UoL1wuL2csJycpOyBlPXVzZXIrJ0AnK2RvbTsgfSB9IHJldHVybiBlOyB9CmZ1bmN0aW9uIG5vcm1QaG9uZShwKXsgcD1TdHJpbmcocHx8JycpLnJlcGxhY2UoL1teXGQrXS9nLCcnKTsgaWYoIXApIHJldHVybiAnJzsgaWYocC5jaGFyQXQoMCkhPT0nKycpeyBwPShwLmxlbmd0aD09PTEwPycrOTEnK3A6JysnK3ApOyB9IHJldHVybiBwOyB9CmFzeW5jIGZ1bmN0aW9uIHNoYTI1NkhleChzKXsgaWYoIXMpIHJldHVybiAnJzsgdmFyIGJ1Zj1hd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdCgnU0hBLTI1NicsIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzKSk7IHJldHVybiBBcnJheS5mcm9tKG5ldyBVaW50OEFycmF5KGJ1ZikpLm1hcChmdW5jdGlvbihiKXtyZXR1cm4gYi50b1N0cmluZygxNikucGFkU3RhcnQoMiwnMCcpO30pLmpvaW4oJycpOyB9CgpmdW5jdGlvbiBydW5Db25maWcoY2ZnKXsKICAkKCdyZXN1bHRzJykuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZScpOyAkKCdzdW1tYXJ5JykuY2xhc3NOYW1lPSdzdW1tYXJ5JzsgJCgnc3VtbWFyeScpLnRleHRDb250ZW50PSdSdW5uaW5n4oCmJzsKICAkKCd0YmwnKS5xdWVyeVNlbGVjdG9yKCd0aGVhZCcpLmlubmVySFRNTD0nJzsgJCgndGJsJykucXVlcnlTZWxlY3RvcigndGJvZHknKS5pbm5lckhUTUw9Jyc7CiAgcmV0dXJuIGZldGNoKCcvcHVsbD90eXBlPScrY2ZnLnR5cGUrJyZkYXlzPScrY2ZnLmRheXMrJyZjbGllbnQ9JytlbmNvZGVVUklDb21wb25lbnQoY2ZnLmNsaWVudCkpLnRoZW4oZnVuY3Rpb24ocil7cmV0dXJuIHIuanNvbigpO30pLnRoZW4oZnVuY3Rpb24oZCl7CiAgICBpZihkLmVycm9yKXsgJCgnc3VtbWFyeScpLmNsYXNzTmFtZT0nc3VtbWFyeSBlcnInOyAkKCdzdW1tYXJ5JykudGV4dENvbnRlbnQ9J0Vycm9yOiAnK2QuZXJyb3I7IHJldHVybjsgfQogICAgc3RhdGUubGFzdD17Y2ZnOmNmZyxkYXRhOmR9OwogICAgdmFyIGV4dHJhPWlzT3JkZXJUeXBlKGNmZy50eXBlKT8oJyDCtyAnKyhkLmdjbGlkQ291bnR8fDApKycgd2l0aCBnY2xpZCDihpIgJytjZmcuY29udik6KCcg4oaSICcrY2ZnLmNvbnYrJyAobGVhZHMpJyk7CiAgICAkKCdzdW1tYXJ5JykudGV4dENvbnRlbnQ9Y2ZnLmNsaWVudCsnIMK3ICcrdHlwZUxhYmVsKGNmZy50eXBlKSsnIMK3IGxhc3QgJytjZmcuZGF5cysnIGRheXMg4oaSICcrZC5jb3VudCsnIHJlY29yZHMnK2V4dHJhOwogICAgdmFyIHRoZWFkPSQoJ3RibCcpLnF1ZXJ5U2VsZWN0b3IoJ3RoZWFkJyksdGI9JCgndGJsJykucXVlcnlTZWxlY3RvcigndGJvZHknKTsKICAgIHRoZWFkLmlubmVySFRNTD0nPHRyPicrZC5jb2x1bW5zLm1hcChmdW5jdGlvbihjKXtyZXR1cm4gJzx0aD4nK2MrJzwvdGg+Jzt9KS5qb2luKCcnKSsnPC90cj4nOwogICAgdGIuaW5uZXJIVE1MPWQucm93cy5zbGljZSgwLDEyKS5tYXAoZnVuY3Rpb24ocm93KXtyZXR1cm4gJzx0cj4nK3Jvdy5tYXAoZnVuY3Rpb24oYyl7cmV0dXJuICc8dGQ+JysoYz09bnVsbD8nJzpTdHJpbmcoYykpKyc8L3RkPic7fSkuam9pbignJykrJzwvdHI+Jzt9KS5qb2luKCcnKTsKICAgICQoJ2RsR2FkcycpLnN0eWxlLmRpc3BsYXk9Jyc7ICQoJ2RsR2FkcycpLnRleHRDb250ZW50PWlzT3JkZXJUeXBlKGNmZy50eXBlKT8nRG93bmxvYWQgR29vZ2xlIEFkcyBDU1YnOidEb3dubG9hZCBHb29nbGUgQWRzIGxlYWRzIENTVic7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7ICQoJ3N1bW1hcnknKS5jbGFzc05hbWU9J3N1bW1hcnkgZXJyJzsgJCgnc3VtbWFyeScpLnRleHRDb250ZW50PSdFcnJvcjogJytlLm1lc3NhZ2U7IH0pOwp9CiQoJ3J1bicpLm9uY2xpY2s9ZnVuY3Rpb24oKXsgcnVuQ29uZmlnKGN1cnJlbnRDb25maWcoKSk7IH07CiQoJ2NvcHlGZWVkJykub25jbGljaz1mdW5jdGlvbigpeyBjb3B5RmVlZChjdXJyZW50Q29uZmlnKCkpOyB9OwokKCdkbERhdGEnKS5vbmNsaWNrPWZ1bmN0aW9uKCl7IGlmKCFzdGF0ZS5sYXN0KXJldHVybjsgdmFyIGQ9c3RhdGUubGFzdC5kYXRhLGNmZz1zdGF0ZS5sYXN0LmNmZzsgZG93bmxvYWQoc2x1ZyhjZmcubmFtZSkrJ18nK2NmZy50eXBlKydfJytjZmcuZGF5cysnZC5jc3YnLCBjc3YoW2QuY29sdW1uc10uY29uY2F0KGQucm93cykpKTsgfTsKJCgnZGxHYWRzJykub25jbGljaz1hc3luYyBmdW5jdGlvbigpewogIGlmKCFzdGF0ZS5sYXN0KXJldHVybjsgdmFyIGQ9c3RhdGUubGFzdC5kYXRhLGNmZz1zdGF0ZS5sYXN0LmNmZzsKICB2YXIgYmFyZT1mdW5jdGlvbih0KXtyZXR1cm4gU3RyaW5nKHQpLnJlcGxhY2UoL1xzKlsrLV1cZFxkOj9cZFxkJC8sJycpO307CiAgdmFyIHBhcmFtcz1bJ1BhcmFtZXRlcnM6VGltZVpvbmU9QXNpYS9Lb2xrYXRhJ107CiAgaWYoaXNPcmRlclR5cGUoY2ZnLnR5cGUpKXsgdmFyIGg9WydHb29nbGUgQ2xpY2sgSUQnLCdDb252ZXJzaW9uIE5hbWUnLCdDb252ZXJzaW9uIFRpbWUnLCdDb252ZXJzaW9uIFZhbHVlJywnQ29udmVyc2lvbiBDdXJyZW5jeScsJ0VtYWlsJ107IHZhciByPWF3YWl0IFByb21pc2UuYWxsKChkLmNvbnZlcnNpb25zfHxbXSkubWFwKGFzeW5jIGZ1bmN0aW9uKGMpe3JldHVybiBbYy5nY2xpZCxjZmcuY29udixiYXJlKGMudGltZSksYy52YWx1ZSxjLmN1cnJlbmN5LGF3YWl0IHNoYTI1NkhleChub3JtRW1haWwoYy5lbWFpbCkpXTt9KSk7IGRvd25sb2FkKHNsdWcoY2ZnLm5hbWUpKydfZ29vZ2xlX2Fkcy5jc3YnLCBjc3YoW3BhcmFtcyxoXS5jb25jYXQocikpKTsgfQogIGVsc2UgeyB2YXIgaDI9WydHb29nbGUgQ2xpY2sgSUQnLCdDb252ZXJzaW9uIE5hbWUnLCdDb252ZXJzaW9uIFRpbWUnLCdDb252ZXJzaW9uIFZhbHVlJywnQ29udmVyc2lvbiBDdXJyZW5jeScsJ0VtYWlsJywnUGhvbmUgTnVtYmVyJ107IHZhciByMj1hd2FpdCBQcm9taXNlLmFsbCgoZC5jb252ZXJzaW9uc3x8W10pLm1hcChhc3luYyBmdW5jdGlvbihjKXtyZXR1cm4gW2MuZ2NsaWQsY2ZnLmNvbnYsYmFyZShjLnRpbWUpLGMudmFsdWUsYy5jdXJyZW5jeSxhd2FpdCBzaGEyNTZIZXgobm9ybUVtYWlsKGMuZW1haWwpKSxhd2FpdCBzaGEyNTZIZXgobm9ybVBob25lKGMucGhvbmUpKV07fSkpOyBkb3dubG9hZChzbHVnKGNmZy5uYW1lKSsnX2dvb2dsZV9hZHNfbGVhZHMuY3N2JywgY3N2KFtwYXJhbXMsaDJdLmNvbmNhdChyMikpKTsgfQp9OwoKLy8gLS0tLSBzZXJ2ZXItYmFja2VkIHBpcGVsaW5lcyAtLS0tCmZ1bmN0aW9uIGFwcGx5Q29uZmlnKHBsKXsKICAkKCdwbmFtZScpLnZhbHVlPXBsLm5hbWU7IGlmKHBsLmNsaWVudCkkKCdjbGllbnQnKS52YWx1ZT1wbC5jbGllbnQ7ICQoJ2RheXMnKS52YWx1ZT1wbC5kYXlzOyAkKCdjb252JykudmFsdWU9cGwuY29udjsgJCgnZnJlcScpLnZhbHVlPXBsLmZyZXF1ZW5jeXx8J29mZic7CiAgc3RhdGUudHlwZT1wbC50eXBlOyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjdHlwZXNlZyBidXR0b24nKS5mb3JFYWNoKGZ1bmN0aW9uKHgpeyB4LmNsYXNzTGlzdC50b2dnbGUoJ29uJywgeC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdHlwZScpPT09cGwudHlwZSk7IH0pOwogICQoJ2NvbnZsYWJlbCcpLnRleHRDb250ZW50PWlzT3JkZXJUeXBlKHBsLnR5cGUpPydHb29nbGUgQWRzIGNvbnZlcnNpb24gYWN0aW9uJzonR29vZ2xlIEFkcyBjb252ZXJzaW9uIGFjdGlvbiAobGVhZCknOwp9CmZ1bmN0aW9uIHJlbmRlclBpcGVzKGxpc3QpewogIHZhciBib3g9JCgncGlwZXMnKTsgYm94LmlubmVySFRNTD0nJzsgJCgnbm9waXBlcycpLnN0eWxlLmRpc3BsYXk9bGlzdC5sZW5ndGg/J25vbmUnOicnOwogIGxpc3QuZm9yRWFjaChmdW5jdGlvbihwbCl7CiAgICB2YXIgZWw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7IGVsLmNsYXNzTmFtZT0ncGlwZSc7CiAgICB2YXIgZnJlcT0ocGwuZnJlcXVlbmN5JiZwbC5mcmVxdWVuY3khPT0nb2ZmJyk/KCc8c3BhbiBjbGFzcz0idGFnIGZyZXEiPicrcGwuZnJlcXVlbmN5Kyc8L3NwYW4+Jyk6JzxzcGFuIGNsYXNzPSJ0YWciPm9uIGRlbWFuZDwvc3Bhbj4nOwogICAgZWwuaW5uZXJIVE1MPSc8ZGl2PjxkaXYgY2xhc3M9Im5tIj4nK3BsLm5hbWUrJyA8c3BhbiBjbGFzcz0idGFnIj4nK3BsLmNvbnYrJzwvc3Bhbj4nK2ZyZXErJzwvZGl2PjxkaXYgY2xhc3M9Im1ldGEiPicrcGwuY2xpZW50KycgwrcgJyt0eXBlTGFiZWwocGwudHlwZSkrJyDCtyBsYXN0ICcrcGwuZGF5cysnIGRheXM8L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPSJzcCI+PC9kaXY+JysKICAgICAgJzxidXR0b24gY2xhc3M9InNlYyIgZGF0YS1ydW49IicrZW5jb2RlVVJJQ29tcG9uZW50KHBsLm5hbWUpKyciPlJ1bjwvYnV0dG9uPjxidXR0b24gY2xhc3M9InNlYyIgZGF0YS1mZWVkPSInK2VuY29kZVVSSUNvbXBvbmVudChwbC5uYW1lKSsnIj5Db3B5IGZlZWQgVVJMPC9idXR0b24+PGJ1dHRvbiBjbGFzcz0ic2VjIiBkYXRhLWRlbD0iJytlbmNvZGVVUklDb21wb25lbnQocGwubmFtZSkrJyI+RGVsZXRlPC9idXR0b24+JzsKICAgIGJveC5hcHBlbmRDaGlsZChlbCk7CiAgfSk7CiAgYm94LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXJ1bl0nKS5mb3JFYWNoKGZ1bmN0aW9uKGIpeyBiLm9uY2xpY2s9ZnVuY3Rpb24oKXsgdmFyIG49ZGVjb2RlVVJJQ29tcG9uZW50KGIuZ2V0QXR0cmlidXRlKCdkYXRhLXJ1bicpKTsgdmFyIHBsPSh3aW5kb3cuX3BpcGVzfHxbXSkuZmluZChmdW5jdGlvbih4KXtyZXR1cm4geC5uYW1lPT09bjt9KTsgaWYocGwpe2FwcGx5Q29uZmlnKHBsKTtydW5Db25maWcocGwpO3dpbmRvdy5zY3JvbGxUbyh7dG9wOjAsYmVoYXZpb3I6J3Ntb290aCd9KTt9IH07IH0pOwogIGJveC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1mZWVkXScpLmZvckVhY2goZnVuY3Rpb24oYil7IGIub25jbGljaz1mdW5jdGlvbigpeyB2YXIgbj1kZWNvZGVVUklDb21wb25lbnQoYi5nZXRBdHRyaWJ1dGUoJ2RhdGEtZmVlZCcpKTsgdmFyIHBsPSh3aW5kb3cuX3BpcGVzfHxbXSkuZmluZChmdW5jdGlvbih4KXtyZXR1cm4geC5uYW1lPT09bjt9KTsgaWYocGwpe2NvcHlGZWVkKHBsKTt9IH07IH0pOwogIGJveC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1kZWxdJykuZm9yRWFjaChmdW5jdGlvbihiKXsgYi5vbmNsaWNrPWZ1bmN0aW9uKCl7IHZhciBuPWRlY29kZVVSSUNvbXBvbmVudChiLmdldEF0dHJpYnV0ZSgnZGF0YS1kZWwnKSk7IGZldGNoKCcvcGlwZWxpbmVzL2RlbGV0ZScse21ldGhvZDonUE9TVCcsaGVhZGVyczp7J0NvbnRlbnQtVHlwZSc6J2FwcGxpY2F0aW9uL2pzb24nfSxib2R5OkpTT04uc3RyaW5naWZ5KHtuYW1lOm4sYWRtaW5QYXNzd29yZDpnZXRBZG1pbigpfSl9KS50aGVuKGZ1bmN0aW9uKHIpe3JldHVybiByLmpzb24oKTt9KS50aGVuKGZ1bmN0aW9uKGQpeyBpZihkLmVycm9yKXthbGVydChkLmVycm9yKTtyZXR1cm47fSBsb2FkUGlwZXMoKTsgfSk7IH07IH0pOwp9CmZ1bmN0aW9uIGxvYWRQaXBlcygpeyBmZXRjaCgnL3BpcGVsaW5lcycpLnRoZW4oZnVuY3Rpb24ocil7cmV0dXJuIHIuanNvbigpO30pLnRoZW4oZnVuY3Rpb24oZCl7IHdpbmRvdy5fcGlwZXM9ZC5waXBlbGluZXN8fFtdOyByZW5kZXJQaXBlcyh3aW5kb3cuX3BpcGVzKTsgfSkuY2F0Y2goZnVuY3Rpb24oKXt9KTsgfQokKCdzYXZlJykub25jbGljaz1mdW5jdGlvbigpewogIHZhciBjZmc9Y3VycmVudENvbmZpZygpOwogIGZldGNoKCcvcGlwZWxpbmVzL3NhdmUnLHttZXRob2Q6J1BPU1QnLGhlYWRlcnM6eydDb250ZW50LVR5cGUnOidhcHBsaWNhdGlvbi9qc29uJ30sYm9keTpKU09OLnN0cmluZ2lmeSh7cGlwZWxpbmU6Y2ZnLGFkbWluUGFzc3dvcmQ6Z2V0QWRtaW4oKX0pfSkudGhlbihmdW5jdGlvbihyKXtyZXR1cm4gci5qc29uKCk7fSkudGhlbihmdW5jdGlvbihkKXsgaWYoZC5lcnJvcil7YWxlcnQoZC5lcnJvcik7cmV0dXJuO30gbG9hZFBpcGVzKCk7IH0pOwp9Owpsb2FkUGlwZXMoKTsKCi8vIC0tLS0gYmFja3VwcyAtLS0tCiQoJ2xvYWRCYWNrdXBzJykub25jbGljaz1mdW5jdGlvbigpewogICQoJ2JhY2t1cHMnKS50ZXh0Q29udGVudD0nTG9hZGluZ+KApic7CiAgZmV0Y2goJy9iYWNrdXBzP2FkbWluPScrZW5jb2RlVVJJQ29tcG9uZW50KGdldEFkbWluKCkpKS50aGVuKGZ1bmN0aW9uKHIpe3JldHVybiByLmpzb24oKTt9KS50aGVuKGZ1bmN0aW9uKGQpewogICAgaWYoZC5lcnJvcil7ICQoJ2JhY2t1cHMnKS50ZXh0Q29udGVudD0nRXJyb3I6ICcrZC5lcnJvcjsgcmV0dXJuOyB9CiAgICBpZighZC5iYWNrdXBzfHwhZC5iYWNrdXBzLmxlbmd0aCl7ICQoJ2JhY2t1cHMnKS50ZXh0Q29udGVudD0nTm8gYmFja3VwcyB5ZXQg4oCUIHRoZSBkYWlseSBzY2hlZHVsZSB3cml0ZXMgdGhlbSBoZXJlLic7IHJldHVybjsgfQogICAgJCgnYmFja3VwcycpLmlubmVySFRNTD1kLmJhY2t1cHMubWFwKGZ1bmN0aW9uKGIpeyByZXR1cm4gJzxkaXYgc3R5bGU9InBhZGRpbmc6NnB4IDA7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSkiPjxhIGNsYXNzPSJsaW5rIiBocmVmPSInK2IudXJsKyciPicrYi5uYW1lKyc8L2E+IDxzcGFuIGNsYXNzPSJtdXQiPignK01hdGgucm91bmQoKGIuc2l6ZXx8MCkvMTAyNCkrJyBLQik8L3NwYW4+PC9kaXY+JzsgfSkuam9pbignJyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7ICQoJ2JhY2t1cHMnKS50ZXh0Q29udGVudD0nRXJyb3I6ICcrZS5tZXNzYWdlOyB9KTsKfTsKCi8vIC0tLS0gbWFuYWdlIGNsaWVudHMgLS0tLQokKCdjX2FkZCcpLm9uY2xpY2s9ZnVuY3Rpb24oKXsKICB2YXIgYm9keT17IG5hbWU6JCgnY19uYW1lJykudmFsdWUudHJpbSgpLCBzaG9waWZ5U3RvcmU6JCgnY19zdG9yZScpLnZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eaHR0cHM/OlwvXC8vLCcnKSwgc2hvcGlmeUNsaWVudElkOiQoJ2NfY2lkJykudmFsdWUudHJpbSgpLCBzaG9waWZ5Q2xpZW50U2VjcmV0OiQoJ2Nfc2VjcmV0JykudmFsdWUsIGdvb2dsZUFkc0N1c3RvbWVySWQ6JCgnY19nYWRzJykudmFsdWUudHJpbSgpLCBlbWFpbDokKCdjX2VtYWlsJykudmFsdWUudHJpbSgpLCBhZG1pblBhc3N3b3JkOiQoJ2NfYWRtaW4nKS52YWx1ZSB9OwogIGlmKCFib2R5Lm5hbWV8fCFib2R5LnNob3BpZnlTdG9yZXx8IWJvZHkuc2hvcGlmeUNsaWVudElkfHwhYm9keS5zaG9waWZ5Q2xpZW50U2VjcmV0KXsgJCgnY19tc2cnKS50ZXh0Q29udGVudD0nRmlsbCBpbiBuYW1lLCBzdG9yZSwgQ2xpZW50IElEIGFuZCBTZWNyZXQuJzsgcmV0dXJuOyB9CiAgJCgnY19tc2cnKS50ZXh0Q29udGVudD0nQWRkaW5n4oCmJzsKICBmZXRjaCgnL2NsaWVudHMvYWRkJyx7bWV0aG9kOidQT1NUJyxoZWFkZXJzOnsnQ29udGVudC1UeXBlJzonYXBwbGljYXRpb24vanNvbid9LGJvZHk6SlNPTi5zdHJpbmdpZnkoYm9keSl9KS50aGVuKGZ1bmN0aW9uKHIpe3JldHVybiByLmpzb24oKTt9KS50aGVuKGZ1bmN0aW9uKGQpewogICAgaWYoZC5lcnJvcil7ICQoJ2NfbXNnJykudGV4dENvbnRlbnQ9J0Vycm9yOiAnK2QuZXJyb3I7IHJldHVybjsgfQogICAgJCgnY19tc2cnKS50ZXh0Q29udGVudD0n4pyTIFNhdmVkLiBDbGllbnRzIG5vdzogJysoZC5jbGllbnRzfHxbXSkuam9pbignLCAnKSsnLiAnKyhkLmRlcGxveVRyaWdnZXJlZD8nUmVkZXBsb3lpbmcgKH40MHMpJzonTm93IHJlZGVwbG95IGluIFZlcmNlbCcpKycg4oCUIHRoZW4gcmVmcmVzaC4nOwogICAgJCgnY19uYW1lJykudmFsdWU9Jyc7JCgnY19zdG9yZScpLnZhbHVlPScnOyQoJ2NfY2lkJykudmFsdWU9Jyc7JCgnY19zZWNyZXQnKS52YWx1ZT0nJzskKCdjX2dhZHMnKS52YWx1ZT0nJzskKCdjX2VtYWlsJykudmFsdWU9Jyc7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7ICQoJ2NfbXNnJykudGV4dENvbnRlbnQ9J0Vycm9yOiAnK2UubWVzc2FnZTsgfSk7Cn07Cjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K", "base64").toString("utf8");

// ---- admin / Vercel API config ----
const ADMIN = process.env.ADMIN_PASSWORD || '';
const VTOKEN = process.env.VERCEL_TOKEN || '';
const VTEAM = process.env.VERCEL_TEAM_ID || 'team_nrWecjRIXWc07D9x1yc86rc8';
const VPROJECT = process.env.VERCEL_PROJECT_NAME || 'digistex-backend';
const VHOOK = process.env.VERCEL_DEPLOY_HOOK || '';
// ---- email (Resend) ----
const RESEND_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.EMAIL_FROM || '';
const MAIL_TO = process.env.EMAIL_TO || '';
async function sendEmail(to, cc, subject, htmlBody, filename, csvText){
  if(!RESEND_KEY || !MAIL_FROM || !to) return { sent:false, reason:'email not configured (need RESEND_API_KEY, EMAIL_FROM, EMAIL_TO)' };
  var payload={ from:MAIL_FROM, to:[to], subject:subject, html:htmlBody };
  if(cc) payload.cc=[cc];
  if(filename && csvText) payload.attachments=[{ filename:filename, content:Buffer.from(csvText,'utf8').toString('base64') }];
  try {
    var r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+RESEND_KEY,'Content-Type':'application/json'},body:JSON.stringify(payload)});
    var t=await r.text();
    return { sent:r.ok, status:r.status };
  } catch(e){ return { sent:false, reason:e.message }; }
}

function json(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); }
function html(res, code, body) { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8' }); res.end(body); }
function ist(iso) { return S.toOffset(iso, cfg.timezoneOffset); }
function readBody(req) { return new Promise(function (resolve) { var d=''; req.on('data', function(c){d+=c;}); req.on('end', function(){ try{ resolve(d?JSON.parse(d):{}); }catch(e){ resolve({}); } }); }); }
function slug(s){ return String(s||'pipeline').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
function toCsv(rows){ var esc=function(v){ v=String(v==null?'':v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }; return rows.map(function(r){return r.map(esc).join(',');}).join('\n'); }
// ---- Google Ads enhanced-conversions hashing (SHA-256 of normalized email/phone) ----
const crypto = require('crypto');
function sha256(v){ return crypto.createHash('sha256').update(v).digest('hex'); }
function hashEmail(e){
  e=String(e||'').trim().toLowerCase(); if(!e) return '';
  var at=e.indexOf('@');
  if(at>-1){ var user=e.slice(0,at), dom=e.slice(at+1);
    if(dom==='gmail.com'||dom==='googlemail.com'){ user=user.split('+')[0].replace(/\./g,''); e=user+'@'+dom; } }
  return sha256(e);
}
function normPhone(p){ p=String(p||'').replace(/[^\d+]/g,''); if(!p) return ''; if(p.charAt(0)!=='+'){ p = (p.length===10 ? '+91'+p : '+'+p); } return p; }
function hashPhone(p){ p=normPhone(p); return p ? sha256(p) : ''; }

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
    var head=['Google Click ID','Conversion Name','Conversion Time','Conversion Value','Conversion Currency','Email','Phone Number'];
    var rows=(data.conversions||[]).map(function(c){return [c.gclid, pl.conv, bare(c.time), c.value, c.currency, hashEmail(c.email), hashPhone(c.phone)];});
    return toCsv([params, head].concat(rows));
  }
  var head=['Google Click ID','Conversion Name','Conversion Time','Conversion Value','Conversion Currency','Email'];
  var rows=(data.conversions||[]).map(function(c){return [c.gclid, pl.conv, bare(c.time), c.value, c.currency, hashEmail(c.email)];});
  return toCsv([params, head].concat(rows));
}

async function doPull(client, token, type, days) {
  if (type === 'contacts') {
    // Leads = abandoned checkouts (added to cart / started checkout, carry gclid) that did NOT become an order.
    const cos = await S.fetchCheckouts(client, token, cfg, days);
    const leads = cos.filter(c => !c.completed_at);
    const columns = ['Google Click ID','Email','Phone','Created (IST)','Value','Currency'];
    const rows = []; const conversions = [];
    for (const c of leads) {
      const g = S.gclidOf(c) || '';
      const ba = c.billing_address || c.shipping_address || {};
      const phone = c.phone || ba.phone || '';
      rows.push([g, c.email||'', phone, ist(c.created_at), c.total_price, c.currency]);
      conversions.push({ gclid:g, time:ist(c.created_at), value:c.total_price, currency:c.currency, email:c.email||'', phone:phone });
    }
    return { type, days, client: client.name, count: rows.length, columns, rows, gclidCount: conversions.filter(x=>x.gclid).length, conversions };
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
        head = ['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency', 'Email', 'Phone Number'];
        rows = (data.conversions || []).map(function (c) { return [c.gclid, conv, bare(c.time), c.value, c.currency, hashEmail(c.email), hashPhone(c.phone)]; });
      } else {
        head = ['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency', 'Email'];
        rows = (data.conversions || []).map(function (c) { return [c.gclid, conv, bare(c.time), c.value, c.currency, hashEmail(c.email)]; });
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
      const nc={ name:b.name, shopifyStore:b.shopifyStore, shopifyClientId:b.shopifyClientId, shopifyClientSecret:b.shopifyClientSecret, googleAdsCustomerId:b.googleAdsCustomerId||'', email:b.email||'', conversionActionId:'', enabled:true };
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
          const csvText=buildGadsCsv(pl, data);
          const fname=slug(pl.name)+'_'+(pl.type||'orders')+'_'+date+'.csv';
          const url=await saveBackup(fname, csvText);
          const isContacts=(pl.type==='contacts');
          const count=isContacts?data.count:(data.gclidCount||0);
          const totalValue=isContacts?null:(data.conversions||[]).reduce(function(s,c){return s+(parseFloat(c.value)||0);},0);
          const currency=(data.conversions&&data.conversions[0]&&data.conversions[0].currency)||'INR';
          const label=isContacts?'lead contacts':'conversions with gclid';
          const valLine=isContacts?'':('<tr><td style="padding:4px 12px;color:#5b6472">Total value</td><td style="padding:4px 12px;font-weight:600">'+currency+' '+totalValue.toFixed(2)+'</td></tr>');
          const subject='['+pl.client+'] '+pl.name+' — '+count+' '+(isContacts?'leads':'conversions')+' ('+date+')';
          const htmlBody='<div style="font:14px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:#161b26">'+
            '<p>The daily conversion feed for <b>'+pl.client+'</b> has been generated and is available to Google Ads via the scheduled upload (action <b>'+pl.conv+'</b>).</p>'+
            '<table style="border-collapse:collapse;margin:8px 0">'+
            '<tr><td style="padding:4px 12px;color:#5b6472">Pipeline</td><td style="padding:4px 12px;font-weight:600">'+pl.name+'</td></tr>'+
            '<tr><td style="padding:4px 12px;color:#5b6472">Records ('+label+')</td><td style="padding:4px 12px;font-weight:600">'+count+'</td></tr>'+
            valLine+
            '<tr><td style="padding:4px 12px;color:#5b6472">Window</td><td style="padding:4px 12px;font-weight:600">last '+pl.days+' days</td></tr>'+
            '<tr><td style="padding:4px 12px;color:#5b6472">Date</td><td style="padding:4px 12px;font-weight:600">'+date+'</td></tr>'+
            '</table>'+
            '<p style="color:#5b6472;font-size:12px">CSV attached. Backup: <a href="'+url+'">'+fname+'</a></p></div>';
          const mail = MAIL_TO ? await sendEmail(MAIL_TO, client.email||'', subject, htmlBody, fname, csvText) : { sent:false, reason:'EMAIL_TO not set' };
          results.push({ pipeline:pl.name, rows:count, url, emailed:mail.sent, emailNote:mail.reason });
        } catch(e){ results.push({ pipeline:pl.name, error:e.message }); }
      }
      return json(res, 200, { ranAt:now.toISOString(), results });
    }
    return html(res, 200, UI_HTML);
  } catch (e) { return json(res, 500, { error: e.message }); }
}).listen(PORT, () => console.log('listening on ' + PORT));
