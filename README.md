# VHFinfo
VHF channel information based on GeoJSON data. Plugin for SignalK included.

## Purpose
While sailing you're often expected to listen out certain VHF channels. Most of them can be found on the electronic maps, but not always in a handy way. And it requires you to know you have to look for it in advance.

By collection the VHF channel info together with coordinate information it's easy to display relevant information in the cockpit.

![VHF example display](./documentation/pictures/vhfinfo.png)

## Format used
The information is collected as [GeoJSON](https://geojson.org/) which holds both coordinates and properties.

## Viewing information
To see if certain VHF information is already present, you can use only of the following country links to see the data plotted on a map.

### World map
[Online map](https://raw.githubusercontent.com/htool/vhfinfo/main/public/index.html)

### Country links

[ABW](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ABW.json&map=2/0/20)
[AFG](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/AFG.json&map=2/0/20)
[AGO](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/AGO.json&map=2/0/20)
[AIA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/AIA.json&map=2/0/20)
[ALA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ALA.json&map=2/0/20)
[ALB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ALB.json&map=2/0/20)
[AND](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/AND.json&map=2/0/20)
[ANT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ANT.json&map=2/0/20)
[ARE](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ARE.json&map=2/0/20)
[ARG](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ARG.json&map=2/0/20)
[ARM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ARM.json&map=2/0/20)
[ASM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ASM.json&map=2/0/20)
[ATA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ATA.json&map=2/0/20)
[ATF](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ATF.json&map=2/0/20)
[ATG](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ATG.json&map=2/0/20)
[AUS](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/AUS.json&map=2/0/20)
[AUT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/AUT.json&map=2/0/20)
[AZE](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/AZE.json&map=2/0/20)
[BDI](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BDI.json&map=2/0/20)
[BEL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BEL.json&map=2/0/20)
[BEN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BEN.json&map=2/0/20)
[BFA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BFA.json&map=2/0/20)
[BGD](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BGD.json&map=2/0/20)
[BGR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BGR.json&map=2/0/20)
[BHR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BHR.json&map=2/0/20)
[BHS](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BHS.json&map=2/0/20)
[BIH](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BIH.json&map=2/0/20)
[BLM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BLM.json&map=2/0/20)
[BLR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BLR.json&map=2/0/20)
[BLZ](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BLZ.json&map=2/0/20)
[BMU](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BMU.json&map=2/0/20)
[BOL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BOL.json&map=2/0/20)
[BRA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BRA.json&map=2/0/20)
[BRB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BRB.json&map=2/0/20)
[BRN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BRN.json&map=2/0/20)
[BTN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BTN.json&map=2/0/20)
[BVT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BVT.json&map=2/0/20)
[BWA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/BWA.json&map=2/0/20)
[CAF](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CAF.json&map=2/0/20)
[CAN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CAN.json&map=2/0/20)
[CCK](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CCK.json&map=2/0/20)
[CHE](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CHE.json&map=2/0/20)
[CHL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CHL.json&map=2/0/20)
[CHN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CHN.json&map=2/0/20)
[CIV](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CIV.json&map=2/0/20)
[CMR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CMR.json&map=2/0/20)
[COD](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/COD.json&map=2/0/20)
[COG](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/COG.json&map=2/0/20)
[COK](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/COK.json&map=2/0/20)
[COL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/COL.json&map=2/0/20)
[COM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/COM.json&map=2/0/20)
[CPV](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CPV.json&map=2/0/20)
[CRI](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CRI.json&map=2/0/20)
[CUB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CUB.json&map=2/0/20)
[CXR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CXR.json&map=2/0/20)
[CYM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CYM.json&map=2/0/20)
[CYP](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CYP.json&map=2/0/20)
[CZE](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/CZE.json&map=2/0/20)
[DEU](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/DEU.json&map=2/0/20)
[DJI](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/DJI.json&map=2/0/20)
[DMA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/DMA.json&map=2/0/20)
[DNK](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/DNK.json&map=2/0/20)
[DOM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/DOM.json&map=2/0/20)
[DZA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/DZA.json&map=2/0/20)
[ECU](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ECU.json&map=2/0/20)
[EGY](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/EGY.json&map=2/0/20)
[ERI](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ERI.json&map=2/0/20)
[ESH](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ESH.json&map=2/0/20)
[ESP](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ESP.json&map=2/0/20)
[EST](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/EST.json&map=2/0/20)
[ETH](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ETH.json&map=2/0/20)
[FIN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/FIN.json&map=2/0/20)
[FJI](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/FJI.json&map=2/0/20)
[FLK](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/FLK.json&map=2/0/20)
[FRA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/FRA.json&map=2/0/20)
[FRO](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/FRO.json&map=2/0/20)
[FSM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/FSM.json&map=2/0/20)
[GAB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GAB.json&map=2/0/20)
[GBR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GBR.json&map=2/0/20)
[GEO](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GEO.json&map=2/0/20)
[GGY](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GGY.json&map=2/0/20)
[GHA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GHA.json&map=2/0/20)
[GIB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GIB.json&map=2/0/20)
[GIN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GIN.json&map=2/0/20)
[GLP](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GLP.json&map=2/0/20)
[GMB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GMB.json&map=2/0/20)
[GNB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GNB.json&map=2/0/20)
[GNQ](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GNQ.json&map=2/0/20)
[GRC](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GRC.json&map=2/0/20)
[GRD](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GRD.json&map=2/0/20)
[GRL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GRL.json&map=2/0/20)
[GTM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GTM.json&map=2/0/20)
[GUF](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GUF.json&map=2/0/20)
[GUM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GUM.json&map=2/0/20)
[GUY](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/GUY.json&map=2/0/20)
[HKG](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/HKG.json&map=2/0/20)
[HMD](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/HMD.json&map=2/0/20)
[HND](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/HND.json&map=2/0/20)
[HRV](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/HRV.json&map=2/0/20)
[HTI](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/HTI.json&map=2/0/20)
[HUN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/HUN.json&map=2/0/20)
[IDN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/IDN.json&map=2/0/20)
[IMN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/IMN.json&map=2/0/20)
[IND](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/IND.json&map=2/0/20)
[IOT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/IOT.json&map=2/0/20)
[IRL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/IRL.json&map=2/0/20)
[IRN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/IRN.json&map=2/0/20)
[IRQ](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/IRQ.json&map=2/0/20)
[ISL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ISL.json&map=2/0/20)
[ISR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ISR.json&map=2/0/20)
[ITA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ITA.json&map=2/0/20)
[JAM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/JAM.json&map=2/0/20)
[JEY](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/JEY.json&map=2/0/20)
[JOR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/JOR.json&map=2/0/20)
[JPN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/JPN.json&map=2/0/20)
[KAZ](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/KAZ.json&map=2/0/20)
[KEN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/KEN.json&map=2/0/20)
[KGZ](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/KGZ.json&map=2/0/20)
[KHM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/KHM.json&map=2/0/20)
[KIR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/KIR.json&map=2/0/20)
[KNA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/KNA.json&map=2/0/20)
[KOR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/KOR.json&map=2/0/20)
[KWT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/KWT.json&map=2/0/20)
[LAO](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LAO.json&map=2/0/20)
[LBN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LBN.json&map=2/0/20)
[LBR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LBR.json&map=2/0/20)
[LBY](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LBY.json&map=2/0/20)
[LCA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LCA.json&map=2/0/20)
[LIE](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LIE.json&map=2/0/20)
[LKA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LKA.json&map=2/0/20)
[LSO](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LSO.json&map=2/0/20)
[LTU](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LTU.json&map=2/0/20)
[LUX](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LUX.json&map=2/0/20)
[LVA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/LVA.json&map=2/0/20)
[MAC](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MAC.json&map=2/0/20)
[MAF](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MAF.json&map=2/0/20)
[MAR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MAR.json&map=2/0/20)
[MCO](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MCO.json&map=2/0/20)
[MDA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MDA.json&map=2/0/20)
[MDG](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MDG.json&map=2/0/20)
[MDV](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MDV.json&map=2/0/20)
[MEX](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MEX.json&map=2/0/20)
[MHL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MHL.json&map=2/0/20)
[MKD](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MKD.json&map=2/0/20)
[MLI](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MLI.json&map=2/0/20)
[MLT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MLT.json&map=2/0/20)
[MMR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MMR.json&map=2/0/20)
[MNE](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MNE.json&map=2/0/20)
[MNG](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MNG.json&map=2/0/20)
[MNP](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MNP.json&map=2/0/20)
[MOZ](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MOZ.json&map=2/0/20)
[MRT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MRT.json&map=2/0/20)
[MSR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MSR.json&map=2/0/20)
[MTQ](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MTQ.json&map=2/0/20)
[MUS](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MUS.json&map=2/0/20)
[MWI](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MWI.json&map=2/0/20)
[MYS](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MYS.json&map=2/0/20)
[MYT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/MYT.json&map=2/0/20)
[NAM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NAM.json&map=2/0/20)
[NCL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NCL.json&map=2/0/20)
[NER](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NER.json&map=2/0/20)
[NFK](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NFK.json&map=2/0/20)
[NGA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NGA.json&map=2/0/20)
[NIC](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NIC.json&map=2/0/20)
[NIU](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NIU.json&map=2/0/20)
[NLD](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NLD.json&map=2/0/20)
[NOR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NOR.json&map=2/0/20)
[NPL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NPL.json&map=2/0/20)
[NRU](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NRU.json&map=2/0/20)
[NZL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/NZL.json&map=2/0/20)
[OMN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/OMN.json&map=2/0/20)
[PAK](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PAK.json&map=2/0/20)
[PAN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PAN.json&map=2/0/20)
[PCN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PCN.json&map=2/0/20)
[PER](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PER.json&map=2/0/20)
[PHL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PHL.json&map=2/0/20)
[PLW](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PLW.json&map=2/0/20)
[PNG](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PNG.json&map=2/0/20)
[POL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/POL.json&map=2/0/20)
[PRI](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PRI.json&map=2/0/20)
[PRK](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PRK.json&map=2/0/20)
[PRT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PRT.json&map=2/0/20)
[PRY](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PRY.json&map=2/0/20)
[PSE](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PSE.json&map=2/0/20)
[PYF](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/PYF.json&map=2/0/20)
[QAT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/QAT.json&map=2/0/20)
[REU](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/REU.json&map=2/0/20)
[ROU](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ROU.json&map=2/0/20)
[RUS](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/RUS.json&map=2/0/20)
[RWA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/RWA.json&map=2/0/20)
[SAU](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SAU.json&map=2/0/20)
[SDN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SDN.json&map=2/0/20)
[SEN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SEN.json&map=2/0/20)
[SGP](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SGP.json&map=2/0/20)
[SGS](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SGS.json&map=2/0/20)
[SHN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SHN.json&map=2/0/20)
[SJM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SJM.json&map=2/0/20)
[SLB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SLB.json&map=2/0/20)
[SLE](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SLE.json&map=2/0/20)
[SLV](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SLV.json&map=2/0/20)
[SMR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SMR.json&map=2/0/20)
[SOM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SOM.json&map=2/0/20)
[SPM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SPM.json&map=2/0/20)
[SRB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SRB.json&map=2/0/20)
[STP](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/STP.json&map=2/0/20)
[SUR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SUR.json&map=2/0/20)
[SVK](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SVK.json&map=2/0/20)
[SVN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SVN.json&map=2/0/20)
[SWE](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SWE.json&map=2/0/20)
[SWZ](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SWZ.json&map=2/0/20)
[SYC](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SYC.json&map=2/0/20)
[SYR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/SYR.json&map=2/0/20)
[TCA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TCA.json&map=2/0/20)
[TCD](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TCD.json&map=2/0/20)
[TGO](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TGO.json&map=2/0/20)
[THA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/THA.json&map=2/0/20)
[TJK](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TJK.json&map=2/0/20)
[TKL](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TKL.json&map=2/0/20)
[TKM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TKM.json&map=2/0/20)
[TLS](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TLS.json&map=2/0/20)
[TON](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TON.json&map=2/0/20)
[TTO](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TTO.json&map=2/0/20)
[TUN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TUN.json&map=2/0/20)
[TUR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TUR.json&map=2/0/20)
[TUV](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TUV.json&map=2/0/20)
[TWN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TWN.json&map=2/0/20)
[TZA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/TZA.json&map=2/0/20)
[UGA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/UGA.json&map=2/0/20)
[UKR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/UKR.json&map=2/0/20)
[UMI](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/UMI.json&map=2/0/20)
[URY](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/URY.json&map=2/0/20)
[USA](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/USA.json&map=2/0/20)
[UZB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/UZB.json&map=2/0/20)
[VAT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/VAT.json&map=2/0/20)
[VCT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/VCT.json&map=2/0/20)
[VEN](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/VEN.json&map=2/0/20)
[VGB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/VGB.json&map=2/0/20)
[VIR](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/VIR.json&map=2/0/20)
[VNM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/VNM.json&map=2/0/20)
[VUT](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/VUT.json&map=2/0/20)
[WLF](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/WLF.json&map=2/0/20)
[WSM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/WSM.json&map=2/0/20)
[YEM](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/YEM.json&map=2/0/20)
[ZAF](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ZAF.json&map=2/0/20)
[ZMB](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ZMB.json&map=2/0/20)
[ZWE](https://geojson.io/#data=data:text/x-url,https://raw.githubusercontent.com/htool/vhfinfo/main/data/ZWE.json&map=2/0/20)

## Adding information
To add information you'll have to
- Draw the coordinates on the map
- Add properties according to the properties template
- Create a change proposal to a country file

### Drawing the coordinates on the map
Goto [GeoJSON.io](https://geojson.io/) and draw the VHF channel area as a polygon.
For different types there are different instructions for drawing:

#### Lock
Only draw the full locks chambers (typically rectangles). It's OK to cross over land for multiple chambers
#### Bridge
Only draw under the bridge, fully from side to side (typically rectangles)
#### Marina
Free figure polygon that covers only the (land and water if that's simpler) marina
#### VTS
Here it is important to cover the documented coordinates of the VTS as close as possible, so likely a polygon. In case of half circles on sea towards a port, it's ok to make it less detailed to reduce points)

### Add properties according to the properties template
Use the following template to populate the properties part on the right in the [GeoJSON.io](https://geojson.io/) interface. Either copy the template in, or type over what you need. It's important to stick to the format.

### Properties template
```
      "properties": {
        "name": "",           // Full name
        "callname": "",       // Short name typically used in call
        "type": "",           // ['lock','bridge','marina','vts','territorial']
        "vhfdata": {
          "generic": {
            "channel": ,      // VHF channel number
            "mode": "listen"  // Radio engagement level for this AIS ship/group type
                              // 'listen':    Listen out the channel for any calls or information
                              // 'announce':  Announce you are entering/leaving the area, or intend to pass bridge/lock
                              // 'report':    More than announce, as certain info is expected. See 'note' for details
            "url": "",        // URL with generic info like opening hours, approach guide etc. or in case of non-generic purpose
            "phone": ""       // Phone number in E.164 formatting
          }
          "pleasure": {       // AIS ship/group type as string. (https://coast.noaa.gov/data/marinecadastre/ais/VesselTypeCodes2018.pdf)
            "url":  ""        // URL aimed at pleasure ships
          },
          "passenger": {
            "note": ""        // Note aimed at passenger ships
          },
          "fishing": {
            "mode": "announce"  // Overwrites mode for fishing ships
          },
          "cargo": {
            "mode": "report",
            "note": "",         // Extra details on what to report
            "url":  ""          // URL aimed at cargo ships
          },
          "update": {               // Update bulletin (eg weather) in this VHF area
            "channel": ,            // Channel used
            "time": "5 5,11,17,23"  // weather bulletin at 5h05, 11h05, 17h05 and 23h05 (cron format)
          },
          "emergency": {
            "url":                  // Information for emergencies in this area
            "phone": ""             // Emergency phone number
          }
        }
      }
    }
```

### Create a change proposal to a country file
- A GitHub account is needed for this part
- Go to the [VHFinfo GitHub repository](https://github.com/htool/vhfinfo/data/) and select the country file you want to add your data to, e.g. [NLD](https://github.com/htool/vhfinfo/blob/main/data/NLD.json).
- Press 'E' or use the pencil button on the top right of the file to start editing the file. Now copy-paste the `feature` part of the JSON from the [GeoJSON.io](https://geojson.io/) website into the GitHub editor.
- Add a `,` to the last `}` of the previous feature if needed.
- At the bottom click `submit proposal`

### Editing existing information
- A GitHub account is needed for this part
- Go to the [VHFinfo GitHub repository](https://github.com/htool/vhfinfo/data/) and select the country file you want to edit, e.g. [NLD](https://github.com/htool/vhfinfo/blob/main/data/NLD.json).
- Press 'E' or use the pencil button on the top right of the file to start editing the file.
- Make your changes
- At the bottom click `submit proposal`


## Plugins
Plugins can be create separate from this repository and just use VHFinfo as database. Listing them here could make them easier to find.

### SignalK
The plugin lets you configure the search 'beam' by specifying the length and angle as well as the SignalK path to write to.
The plugin flow is as follows:
 1. Determine own location using `navigation.position`
 2. Draw a boundry box around the location with 100Nm (configurable) ribs
 3. Use countries_bbox.json to create bboxes and check if they intersect with the locationBox from step 2
 4. Read features from intersecting to see which intersect with locationBox from 2 and keep them in memory (featuresInBox)
 5. Use heading and location to crete a searchPolygon 'beam' using the plugin config parameters
 6. Go through the features in featuresInBox and check if they intersect with searchPolygon
 7. Use result of 6 to calculate distance to each feature and sort by distance (negative distance means your located inside the feature)
 8. /plugin/vhfinfo/nearby can be called to pull the whole result set of 7.
 9. Write the nearest POI and VTS to the path configured in the plugin

#### API
The resulting nearby VHF info objects array can be queried here:
```
/plugins/vhfinfo/nearby
```

#### SignalK path
You can configure where the plugin writes the two nearest Point of Interest (lock, bridge, marina) and VTS (Vessel Traffic Service). This can be used together with the [SignalK Instrument Display Plugin](https://www.npmjs.com/package/signalk-instrument-display-plugin) to display current VHF info on any display.
