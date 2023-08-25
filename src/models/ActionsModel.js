export const Action = {
  finalizar: 'finalizar',
  falar_com_atendente: 'falar_com_atendente',
  transferir_entre_departamentos: 'transferir_entre_departamentos',
  abrir_ticket: 'abrir_ticket',
  consultar_crm: 'consultar_crm',
  atualizar_crm: 'atualizar_crm',
  cadastrar: 'cadastrar',
  consultar_cep: 'consultar_cep',
  send_list: 'send_list',
  send_button: 'send_button'
}
export default class ActionModel {
  static finalizar = new ActionModel({ action: Action.finalizar, only: true })
  static falar_com_atendente = new ActionModel({ action: Action.falar_com_atendente, params: { optional: ['department_to'] } })
  static transferir_entre_departamentos = new ActionModel({ action: Action.transferir_entre_departamentos, params: { required: ['department_to'] } })
  static abrir_ticket = new ActionModel({ action: Action.abrir_ticket, params: { required: ['phase'] } })
  static consultar_crm = new ActionModel({ action: Action.consultar_crm })
  static atualizar_crm = new ActionModel({ action: Action.atualizar_crm })
  static cadastrar = new ActionModel({ action: Action.cadastrar })
  static consultar_cep = new ActionModel({ action: Action.consultar_cep })
  static send_list = new ActionModel({ action: Action.send_list })
  static send_button = new ActionModel({ action: Action.send_button })

  constructor({ action, params, only }) {
    this.action = action
    this.params = params
    this.only = only
  }

  async get() {
    return Object.keys(ActionModel).map(action => {
      return ActionModel[action]
    })
  }

}
