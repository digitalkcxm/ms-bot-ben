export const Operator = {
  AND: 'AND',
  OR: 'OR'
}
export default class OperatorModel {
  static and = new OperatorModel({ operator: Operator.AND })
  static or = new OperatorModel({ operator: Operator.OR })

  constructor({ operator }) {
    this.operator = operator
  }

  async get() {
    return Object.keys(OperatorModel).map(operator => {
      return OperatorModel[operator]
    })
  }

}