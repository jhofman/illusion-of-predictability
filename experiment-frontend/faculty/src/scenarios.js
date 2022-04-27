import _ from "lodash"

const scenarioA = [{"mu1":0.79,"mu2":0.49,"variance1":1.39,"variance2":2.74,"n1":89,"n2":91,"probOfSuperiority":0.56,"scenarioType":"A","scenarioId":1},{"mu1":0.72,"mu2":0.37,"variance1":2.6,"variance2":2.46,"n1":50,"n2":54,"probOfSuperiority":0.56,"scenarioType":"A","scenarioId":2},{"mu1":1.32,"mu2":1.13,"variance1":2.71,"variance2":1.46,"n1":27,"n2":30,"probOfSuperiority":0.54,"scenarioType":"A","scenarioId":3},{"mu1":0.81,"mu2":0.48,"variance1":1.22,"variance2":2.33,"n1":60,"n2":44,"probOfSuperiority":0.57,"scenarioType":"A","scenarioId":4}] 
const scenarioB = [{"mu1":1.32,"mu2":0.8,"variance1":1.43,"variance2":1.78,"n1":59,"n2":51,"probOfSuperiority":0.61,"scenarioType":"B","scenarioId":1},{"mu1":2.95,"mu2":2.17,"variance1":1.06,"variance2":2.34,"n1":36,"n2":43,"probOfSuperiority":0.66,"scenarioType":"B","scenarioId":2},{"mu1":2.1,"mu2":1.56,"variance1":1.64,"variance2":1.17,"n1":93,"n2":95,"probOfSuperiority":0.63,"scenarioType":"B","scenarioId":3},{"mu1":1.91,"mu2":1.31,"variance1":3,"variance2":1.46,"n1":99,"n2":84,"probOfSuperiority":0.61,"scenarioType":"B","scenarioId":4}] 
const scenarioC = [{"mu1":2.25,"mu2":0.71,"variance1":2.15,"variance2":2.76,"n1":32,"n2":40,"probOfSuperiority":0.76,"scenarioType":"C","scenarioId":1},{"mu1":2.78,"mu2":1.74,"variance1":2.52,"variance2":1.14,"n1":60,"n2":83,"probOfSuperiority":0.71,"scenarioType":"C","scenarioId":2},{"mu1":1.52,"mu2":0.27,"variance1":2.8,"variance2":1.16,"n1":77,"n2":74,"probOfSuperiority":0.74,"scenarioType":"C","scenarioId":3},{"mu1":2.03,"mu2":0.68,"variance1":2.15,"variance2":2.99,"n1":92,"n2":90,"probOfSuperiority":0.72,"scenarioType":"C","scenarioId":4}] 
const scenarioD = [{"mu1":2.89,"mu2":1.26,"variance1":1.41,"variance2":1.59,"n1":48,"n2":45,"probOfSuperiority":0.83,"scenarioType":"D","scenarioId":1},{"mu1":2.42,"mu2":0.34,"variance1":2.32,"variance2":1.13,"n1":84,"n2":74,"probOfSuperiority":0.87,"scenarioType":"D","scenarioId":2},{"mu1":1.64,"mu2":0.23,"variance1":1.53,"variance2":1.16,"n1":74,"n2":79,"probOfSuperiority":0.81,"scenarioType":"D","scenarioId":3},{"mu1":2.45,"mu2":0.78,"variance1":1.79,"variance2":1.47,"n1":41,"n2":41,"probOfSuperiority":0.82,"scenarioType":"D","scenarioId":4}] 
const scenarioE = [{"mu1":2.76,"mu2":0.34,"variance1":1.19,"variance2":1.58,"n1":27,"n2":25,"probOfSuperiority":0.93,"scenarioType":"E","scenarioId":1},{"mu1":2.97,"mu2":0.88,"variance1":1.02,"variance2":1.12,"n1":90,"n2":91,"probOfSuperiority":0.92,"scenarioType":"E","scenarioId":2},{"mu1":2.12,"mu2":0.17,"variance1":1.08,"variance2":1.11,"n1":62,"n2":48,"probOfSuperiority":0.91,"scenarioType":"E","scenarioId":3},{"mu1":2.91,"mu2":0,"variance1":1.74,"variance2":1.63,"n1":62,"n2":48,"probOfSuperiority":0.94,"scenarioType":"E","scenarioId":4}] 

export const getShuffledScenario = () => {
	let first5 = _.shuffle([scenarioA[0], scenarioB[0], scenarioC[0], scenarioD[0], scenarioE[0]])
	let middle10 = _.shuffle([
		scenarioA[1], scenarioB[1], scenarioC[1], scenarioD[1], scenarioE[1],
		scenarioA[2], scenarioB[2], scenarioC[2], scenarioD[2], scenarioE[2],
	])
	let last5 = _.shuffle([scenarioA[3], scenarioB[3], scenarioC[3], scenarioD[3], scenarioE[3]])

	return _.flatten([first5, middle10, last5])
}