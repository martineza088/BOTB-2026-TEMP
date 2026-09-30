"""Generate the fictional example packet and QA page images."""
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / 'jorge-auto-parts-business-information-packet.pdf'
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleCustom', fontName='Helvetica-Bold', fontSize=28, leading=33, textColor=colors.HexColor('#142b49'), spaceAfter=14))
styles.add(ParagraphStyle(name='SectionCustom', fontName='Helvetica-Bold', fontSize=18, leading=23, textColor=colors.HexColor('#142b49'), spaceAfter=14))
styles.add(ParagraphStyle(name='BodyCustom', fontSize=10.5, leading=16, spaceAfter=10))
styles.add(ParagraphStyle(name='SmallCustom', fontSize=8.5, leading=12, spaceAfter=8))
styles.add(ParagraphStyle(name='CellCustom', fontSize=8.5, leading=12))
story = []
def p(text, style='BodyCustom'):
    return Paragraph(text, styles[style])
def add(text, style='BodyCustom'):
    story.append(p(text, style))
def heading(kicker, title):
    add(kicker.upper(), 'SmallCustom')
    add(title, 'SectionCustom')
def table(rows, widths, padding=8):
    data = [[p(str(cell), 'CellCustom') for cell in row] for row in rows]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dfe8f3')),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, colors.HexColor('#f4f7fb')]),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
        ('TOPPADDING',(0,0),(-1,-1),padding),('BOTTOMPADDING',(0,0),(-1,-1),padding),
        ('LINEBELOW',(0,0),(-1,0),0.7,colors.HexColor('#a5b7ce')),
    ]))
    story.append(t)
    story.append(Spacer(1,12))

products = [
 ('JP-001','Universal car muffler','Aluminized steel; fitment and inlet size must be confirmed.',89.99,8,1,10),
 ('JP-002','Clutch kit','Disc, pressure plate and release bearing; vehicle-specific.',249.99,3,1,4),
 ('JP-003','Front brake pad set','Ceramic pads; one front-axle set.',49.99,16,2,12),
 ('JP-004','Brake rotor','Standard replacement rotor; sold individually.',64.99,12,2,8),
 ('JP-005','Engine oil filter','Spin-on or cartridge style selected by vehicle.',12.99,30,0,24),
 ('JP-006','Engine air filter','Replacement panel filter; vehicle-specific.',19.99,20,1,16),
 ('JP-007','Spark plug','Standard replacement plug; sold individually.',8.99,48,4,24),
 ('JP-008','Serpentine belt','Replacement drive belt; length and routing vary.',34.99,9,1,8),
 ('JP-009','12V car battery','Group size varies; new battery, no core charge in this sample.',159.99,6,1,6),
 ('JP-010','Alternator','New replacement alternator; no core charge in this sample.',219.99,2,1,4),
 ('JP-011','Radiator hose','Upper or lower hose; select exact application.',24.99,11,0,8),
 ('JP-012','5W-30 motor oil','Full synthetic; one 5-quart jug.',32.99,0,0,12),
]

add('EXAMPLE BUSINESS INFORMATION PACKET / DOCUMENT', 'SmallCustom')
add("Jorge's\nAuto Parts".replace('\n','<br/>'), 'TitleCustom')
add('A small, owner-operated auto parts shop in Hutto, Texas.')
add('<b>Sample packet</b>')
add('This is a fictional example for testing the Business MCP setup workflow. Jorge, the Hutto location, and the opening hours follow the requested scenario. The business name, street address, contact details, products, prices, inventory quantities, policies, and branding are illustrative and are not verified real business facts.')
heading('01 / Business profile', 'Business and location')
table([
 ['Field','Business information'],
 ['Business name',"Jorge's Auto Parts (sample name)"],
 ['Owner','Jorge - small business owner; purchasing and customer-service contact'],
 ['Business model','Retail sale of car parts and maintenance supplies to local drivers and independent mechanics. Installation and repair services are not offered in this example.'],
 ['Location','100 Example Lane, Hutto, Texas 78634 (fictional address; not a customer destination)'],
 ['Phone / email','(512) 555-0147 / jorge@example.com (sample contact details)'],
 ['Fulfillment','In-store purchases and pickup. No shipping or delivery in this sample.'],
 ],[110,406])
heading('Opening hours', 'Visit the shop')
table([['Days','Hours'],['Monday through Friday','7:00 AM - 7:00 PM'],['Saturday','7:00 AM - 5:00 PM'],['Sunday','7:00 AM - 2:00 PM']],[220,296])
add('Time zone: America/Chicago (Central Time; CST or CDT as applicable). Holiday hours may differ and should be confirmed with Jorge.', 'SmallCustom')

story.append(PageBreak())
heading('02 / Products and pricing', 'Car parts catalog')
add('All prices are sample retail prices in USD, per selling unit shown below, before applicable sales tax. No installation labor is included. These prices are illustrative, not current market quotes.')
table([['SKU','Product / selling unit','Description and fitment','Price (USD)']] + [[sku,name,desc,f'${price:,.2f}'] for sku,name,desc,price,*_ in products],[58,146,238,74])
add('<b>Before ordering:</b> provide the vehicle year, make, model, engine, and VIN when available. A listed part is not guaranteed to fit every vehicle. Jorge confirms compatibility and the final item-specific price before payment.')
add('<b>Price changes:</b> sample prices are illustrative and must be confirmed before use. Special-order alternatives and vehicle-specific versions may cost more or less; confirm a quote before purchase.', 'SmallCustom')

story.append(PageBreak())
heading('03 / Inventory and availability', 'Current inventory snapshot')
add('<b>Sample inventory status - undated example.</b> This is a static example, not a live inventory feed. Confirm availability before promising a part to a customer.')
inventory = [['SKU / product','On hand','Reserved','Available','Status','On order']]
for sku,name,desc,price,onhand,reserved,onorder in products:
    available=onhand-reserved
    status='Out of stock' if available==0 else 'Low stock' if available<=3 else 'In stock'
    inventory.append([f'{sku}<br/>{name}',onhand,reserved,available,status,onorder])
table(inventory,[196,58,62,64,78,58],padding=4)
add('<b>Definitions:</b> On hand is physically in the shop. Reserved is allocated to confirmed pickups. Available = on hand minus reserved. On order is expected incoming stock and is not available to sell today.')
add('<b>Status rules:</b> 0 available = Out of stock; 1-3 available = Low stock; 4 or more available = In stock. Counts use each product\'s selling unit (for example, one clutch kit or one brake pad set).')
add('<b>Restock:</b> incoming orders are sample quantities. No delivery dates are confirmed. Jorge must check the supplier before giving a customer an expected arrival time.', 'SmallCustom')

story.append(PageBreak())
heading('04 / Sample business policies', 'Purchases, returns and support')
add('The following are illustrative everyday retail policies for this fictional shop. Jorge must approve the final terms before they are used with customers.', 'SmallCustom')
for title,body in [
 ('Payments and receipts','Cash and major credit/debit cards are accepted. Payment is due at purchase or pickup. A receipt is provided. Prices exclude applicable sales tax; the amount is shown before payment.'),
 ('Returns and exchanges','Unused, uninstalled parts in their original packaging may be returned within 30 calendar days with the receipt. Refunds use the original payment method where possible. Damaged, installed, or incomplete items need individual review.'),
 ('Electrical parts and special orders','Opened or installed electrical parts and special-order items need approval before return. Any item-specific return restriction or deposit must be disclosed before the customer places the order.'),
 ('Defects and warranties','Manufacturer warranties vary by part. Bring the receipt and part details to Jorge for assistance with a suspected defect. Warranty coverage and remedies are confirmed for the specific item; this packet does not promise a universal warranty.'),
 ('Pickup and reservations','Confirmed parts may be held for 24 hours during business hours. Call if more time is needed. Stock is not reserved until the shop confirms the hold. Uncollected holds may be released.'),
 ('Order changes and cancellations','Contact Jorge as soon as possible. In-stock orders may be canceled before pickup. Supplier commitments can limit special-order cancellation; any applicable terms must be agreed before ordering.'),
 ('Customer information','Collect only the contact and vehicle details needed to fulfill an order. Do not include payment-card details in the business packet. Customer contact information is used for order and support communications.'),
]:
    add(f'<b>{title}.</b> {body}')
heading('05 / Branding', 'A helpful neighborhood parts counter')
add('<b>Brand name:</b> Jorge\'s Auto Parts. <b>Voice:</b> friendly, practical, patient, and clear. Explain part choices without assuming the customer understands automotive jargon.')
add('<b>Brand colors:</b> navy #142B49, shop orange #E87524, and white #FFFFFF. <b>Logo guidance:</b> simple business-name wordmark; no finished logo is supplied in this sample.')
add('<b>Assistant guidance:</b> identify uncertain fitment, stock, pricing, or policy information and refer it to Jorge. Never invent compatibility or treat this static inventory snapshot as live data.', 'SmallCustom')

def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor('#cbd5e1'))
    canvas.line(48,43,564,43)
    canvas.setFont('Helvetica',8)
    canvas.setFillColor(colors.HexColor('#526278'))
    canvas.drawString(48,29,"Jorge's Auto Parts | Fictional sample packet")
    canvas.drawRightString(564,29,f'Page {doc.page}')

doc=SimpleDocTemplate(str(PDF),pagesize=(612,792),rightMargin=48,leftMargin=48,topMargin=40,bottomMargin=58,title="Jorge's Auto Parts - Sample Business Information Packet",author='Business MCP Sample')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
reader=PdfReader(str(PDF))
assert len(reader.pages)==4, f'Unexpected page count: {len(reader.pages)}'
text='\n'.join(page.extract_text() for page in reader.pages)
for term in ['Clutch kit','$249.99','Reserved','BRANDING','Hutto','7:00 AM - 2:00 PM']:
    assert term in text, term
qa=ROOT/'tmp'/'pdfs'
qa.mkdir(parents=True,exist_ok=True)
rendered=pdfium.PdfDocument(str(PDF))
for i in range(len(rendered)):
    image=rendered[i].render(scale=1.3).to_pil()
    image.save(qa/f'jorge-packet-page-{i+1}.png')
print(f'Created {PDF}; {len(reader.pages)} pages; text checks passed.')



